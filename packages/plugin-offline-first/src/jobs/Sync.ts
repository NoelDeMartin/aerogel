import { map, mixed, objectWithout, requireUrlParentDirectory, required } from '@noeldemartin/utils';
import { App, Job } from '@aerogel/core';
import { SolidModel, Tombstone, isContainer, isContainerClass } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainsRelation } from 'soukai-solid';

import {
    cloneLocalModel,
    cloneRemoteModel,
    completeRemoteModels,
    getLocalModel,
    getLocalModels,
    getRemoteClass,
    getRemoteModel,
    isRegisteredModel,
    isRemoteModel,
    trackModelsCollection,
} from '@/lib/mirroring';
import {
    getContainerRegisteredClasses,
    getContainerRelations,
    getRelatedAppModels,
    isDirtyOrHasDirtyChildren,
} from '@/lib/inference';

import LoadsChildren from './mixins/LoadsChildren';
import LoadsTypeIndex from './mixins/LoadsTypeIndex';
import TracksLocalModels from './mixins/TracksLocalModels';

const Cloud = required(() => App.service('$cloud'));

export default class Sync extends mixed(Job, [LoadsChildren, LoadsTypeIndex, TracksLocalModels]) {

    protected models?: SolidModel[];
    protected localModels: ObjectsMap<SolidModel>;
    protected rootLocalModels: SolidModel[];

    constructor(models?: SolidModel[]) {
        super();

        this.models = models;
        this.localModels = map([], 'url');
        this.rootLocalModels = [];
    }

    protected async run(): Promise<void> {
        this.rootLocalModels = this.models ?? getLocalModels();

        await this.indexLocalModels(this.rootLocalModels);
        await this.pullChanges();
        await this.pushChanges();
    }

    protected async pullChanges(): Promise<void> {
        const remoteModelsArray = this.models
            ? await this.fetchRemoteModelsForLocal(this.models)
            : await this.fetchRemoteModels();
        const remoteModels = map(remoteModelsArray, (model) => {
            if (model instanceof Tombstone) {
                return model.resourceUrl;
            }

            return model.url;
        });

        await this.synchronizeModels(remoteModels);

        Cloud.setState({
            dirtyRemoteModels: map(
                remoteModels.getItems().filter((model) => isDirtyOrHasDirtyChildren(model)),
                'url',
            ),
            remoteOperationUrls: remoteModels.getItems().reduce((urls, model) => {
                const operationUrls = model
                    .getRelatedModels()
                    .map((related) => related.operations ?? [])
                    .flat()
                    .map((operation) => operation.url);

                if (operationUrls.length > 0) {
                    urls[model.url] = operationUrls;
                }

                return urls;
            }, {} as Record<string, string[]>),
        });
    }

    protected async pushChanges(): Promise<void> {
        const modelUrls = this.models?.map((model) => model.url);
        const remoteModels = Cloud.dirtyRemoteModels
            .getItems()
            .filter((model) => !modelUrls || modelUrls.includes(model.url));

        for (const remoteModel of remoteModels) {
            if (remoteModel.isSoftDeleted()) {
                remoteModel.enableHistory();
                remoteModel.enableTombstone();
                await remoteModel.delete();

                return;
            }

            await this.saveModelAndChildren(remoteModel);
            await this.updateTypeRegistrations(remoteModel);
        }

        Cloud.setState({
            dirtyRemoteModels: modelUrls
                ? Cloud.dirtyRemoteModels.filter((_, url) => !modelUrls.includes(url))
                : map([], 'url'),
            remoteOperationUrls: remoteModels.reduce((urls, model) => {
                const operationUrls = model
                    .getRelatedModels()
                    .map((related) => related.operations ?? [])
                    .flat()
                    .map((operation) => operation.url);

                if (operationUrls.length > 0) {
                    urls[model.url] = operationUrls;
                }

                return urls;
            }, Cloud.remoteOperationUrls),
            localModelUpdates: modelUrls ? objectWithout(Cloud.localModelUpdates, modelUrls) : {},
        });
    }

    protected async fetchRemoteModels(): Promise<SolidModel[]> {
        const typeIndex = await this.loadTypeIndex();

        if (!typeIndex) {
            return [];
        }

        const remoteModels: SolidModel[] = [];
        const processedContainerUrls = new Set();
        const registeredModels = [...Cloud.registeredModels].map(({ modelClass }) => {
            const registeredChildren = isContainerClass(modelClass) ? getContainerRegisteredClasses(modelClass) : [];

            return {
                modelClass,
                rdfsClasses:
                    registeredChildren.length > 0
                        ? registeredChildren.map((childrenClass) => childrenClass.rdfsClasses).flat()
                        : modelClass.rdfsClasses,
            };
        });

        for (const registration of typeIndex.registrations) {
            const registeredModel = registeredModels.find(
                ({ rdfsClasses }) =>
                    !!registration.instanceContainer &&
                    rdfsClasses.some((rdfsClass) => registration.forClass.includes(rdfsClass)),
            );

            if (
                !registeredModel ||
                !registration.instanceContainer ||
                processedContainerUrls.has(registration.instanceContainer)
            ) {
                continue;
            }

            const remoteClass = getRemoteClass(registeredModel.modelClass);

            processedContainerUrls.add(registration.instanceContainer);

            if (isContainerClass(remoteClass)) {
                await trackModelsCollection(
                    registeredModel.modelClass,
                    requireUrlParentDirectory(registration.instanceContainer),
                );

                const container = await remoteClass.find(registration.instanceContainer);

                if (container) {
                    await this.loadChildren(container);

                    remoteModels.push(container);
                }

                continue;
            }

            await trackModelsCollection(registeredModel.modelClass, registration.instanceContainer);

            remoteModels.push(...(await remoteClass.from(registration.instanceContainer).all()));
        }

        return completeRemoteModels(this.rootLocalModels, remoteModels);
    }

    protected async fetchRemoteModelsForLocal(models: SolidModel[]): Promise<SolidModel[]> {
        const remoteModels = [];

        for (const localModel of models) {
            const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);

            if (!remoteModel) {
                continue;
            }

            isContainer(remoteModel) && (await this.loadChildren(remoteModel));

            remoteModels.push(remoteModel);
        }

        return completeRemoteModels(models, remoteModels);
    }

    protected async updateTypeRegistrations(remoteModel: SolidModel): Promise<void> {
        if (!isContainer(remoteModel) || !isRegisteredModel(remoteModel)) {
            return;
        }

        const registeredChildren = getContainerRegisteredClasses(remoteModel.static());

        if (registeredChildren.length === 0) {
            return;
        }

        const typeIndex = await this.loadTypeIndex({ create: true });

        if (typeIndex.registrations.some((registration) => registration.instanceContainer === remoteModel.url)) {
            return;
        }

        await remoteModel.register(typeIndex, registeredChildren);
    }

    protected async loadChildren(model: SolidModel): Promise<void> {
        if (!isContainer(model)) {
            return;
        }

        const children = await this.loadContainedModels(model);

        for (const child of children) {
            await this.loadChildren(child);
        }
    }

    protected async saveModelAndChildren(model: SolidModel): Promise<void> {
        if (isRemoteModel(model) && model.isSoftDeleted()) {
            model.enableHistory();
            model.enableTombstone();
            await model.delete();

            return;
        }

        await model.save();

        if (!isContainer(model)) {
            return;
        }

        const children = getContainerRelations(model.static())
            .map((relation) => model.getRelationModels(relation) ?? [])
            .flat();

        for (const child of children) {
            await this.saveModelAndChildren(child);
        }
    }

    protected async synchronizeModels(remoteModels: ObjectsMap<SolidModel>): Promise<void> {
        const synchronizedModelUrls = new Set<string>();

        for (const remoteModel of remoteModels.items()) {
            if (remoteModel instanceof Tombstone) {
                const localModel = this.localModels.get(remoteModel.resourceUrl);

                if (localModel) {
                    await localModel.delete();

                    synchronizedModelUrls.add(remoteModel.resourceUrl);
                }

                continue;
            }

            const localModel = getLocalModel(remoteModel, this.localModels);

            await this.loadChildren(localModel);
            await SolidModel.synchronize(localModel, remoteModel);
            await this.reconcileInconsistencies(localModel, remoteModel);
            await this.saveModelAndChildren(localModel);
            await this.addLocalModel(localModel);

            this.rootLocalModels.push(localModel);
            synchronizedModelUrls.add(localModel.url);
        }

        for (const localModel of this.rootLocalModels) {
            if (synchronizedModelUrls.has(localModel.url)) {
                continue;
            }

            await this.loadChildren(localModel);

            const remoteModel = getRemoteModel(localModel, remoteModels);

            await SolidModel.synchronize(localModel, remoteModel);

            remoteModels.add(remoteModel);
        }
    }

    private async reconcileInconsistencies(
        localModel: SolidModel,
        remoteModel: SolidModel,
        processedModels?: Set<SolidModel>,
    ): Promise<void> {
        localModel.rebuildAttributesFromHistory();
        localModel.setAttributes(remoteModel.getAttributes(true));

        processedModels ??= new Set();
        processedModels.add(localModel);

        for (const relation of getContainerRelations(localModel.static())) {
            await this.synchronizeContainerDocuments(
                localModel.requireRelation<SolidContainsRelation>(relation),
                remoteModel.requireRelation<SolidContainsRelation>(relation),
            );
        }

        const remoteRelatedModels = map(getRelatedAppModels(remoteModel), 'url');

        for (const localRelatedModel of getRelatedAppModels(localModel)) {
            if (
                processedModels.has(localRelatedModel) ||
                !localRelatedModel.isRelationLoaded('operations') ||
                !remoteRelatedModels.hasKey(localRelatedModel.url)
            ) {
                continue;
            }

            await this.reconcileInconsistencies(localRelatedModel, remoteRelatedModels.require(localRelatedModel.url));
        }

        if (localModel.isDirty()) {
            await localModel.save();
            await SolidModel.synchronize(localModel, remoteModel);
        }
    }

    private async synchronizeContainerDocuments(
        localRelation: SolidContainsRelation,
        remoteRelation: SolidContainsRelation,
    ): Promise<void> {
        const localModels = map(localRelation.related ?? [], 'url');
        const remoteModels = map(remoteRelation.related ?? [], 'url');
        const newLocalModelUrls = localModels
            .getKeys()
            .filter((url) => !remoteModels.hasKey(url) && !remoteModels.hasKey(encodeURI(url)));
        const newRemoteModelUrls = remoteModels
            .getKeys()
            .filter((url) => !localModels.hasKey(url) && !localModels.hasKey(encodeURI(url)));

        for (const url of newLocalModelUrls) {
            const localModel = localModels.require(url);
            const remoteModel = cloneLocalModel(localModel);

            remoteRelation.addRelated(remoteModel);
            remoteModels.add(remoteModel);
        }

        for (const url of newRemoteModelUrls) {
            const remoteModel = remoteModels.require(url);
            const localModel = cloneRemoteModel(remoteModel);

            localRelation.addRelated(localModel);
            localModels.add(localModel);
        }

        for (const localModel of localModels.items()) {
            const remoteModel = remoteModels.require(localModel.url);

            await SolidModel.synchronize(localModel, remoteModel);
            await this.saveModelAndChildren(localModel);
        }
    }

}
