import { App, Job } from '@aerogel/core';
import { arrayFilter, arrayFrom, map, objectWithout, requireUrlParentDirectory, required } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidModel, Tombstone, isContainer, isContainerClass } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainer, SolidContainsRelation, SolidDocument, SolidTypeIndex } from 'soukai-solid';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';

import {
    getContainerRegisteredClasses,
    getContainerRelations,
    getSameDocumentRelations,
    isDirtyOrHasDirtyChildren,
} from '@/lib/inference';
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
import DocumentsCache from '@/services/DocumentsCache';
import { lazy } from '@/lib/utils';

const Cloud = required(() => App.service('$cloud'));
const typeIndexes: WeakMap<SolidUserProfile, SolidTypeIndex | null> = new WeakMap();

export default class Sync extends Job {

    protected models?: SolidModel[];
    protected localModels: ObjectsMap<SolidModel>;
    protected rootLocalModels: SolidModel[];

    constructor(models?: SolidModel[]) {
        super();

        this.models = models;
        this.localModels = map([], 'url');
        this.rootLocalModels = [];
    }

    public async run(): Promise<void> {
        await this.indexLocalModels();
        await this.pullChanges();
        await this.pushChanges();
    }

    protected async getTypeIndex(options: { create: true }): Promise<SolidTypeIndex>;
    protected async getTypeIndex(options?: { create: false }): Promise<SolidTypeIndex | null>;
    protected async getTypeIndex(options: { create?: boolean } = {}): Promise<SolidTypeIndex | null> {
        const user = Solid.requireUser();

        if (options.create && !typeIndexes.get(user)) {
            typeIndexes.set(user, await Solid.findOrCreatePrivateTypeIndex());
        } else if (!typeIndexes.has(user)) {
            typeIndexes.set(user, await Solid.findPrivateTypeIndex());
        }

        return typeIndexes.get(user) ?? null;
    }

    protected async indexLocalModels(): Promise<void> {
        for (const localModel of this.models ?? getLocalModels()) {
            this.rootLocalModels.push(localModel);

            await this.addLocalModel(localModel);
        }
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

    protected async addLocalModel(localModel: SolidModel): Promise<void> {
        if (this.localModels.hasKey(localModel.url)) {
            return;
        }

        this.localModels.add(localModel);

        for (const relation of getContainerRelations(localModel.static())) {
            await localModel.loadRelationIfUnloaded(relation);
        }

        for (const relatedModel of localModel.getRelatedModels()) {
            await this.addLocalModel(relatedModel);
        }
    }

    protected async fetchRemoteModels(): Promise<SolidModel[]> {
        const typeIndex = await this.getTypeIndex();

        if (!typeIndex) {
            return [];
        }

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

        const remoteModels = await Promise.all(
            typeIndex.registrations.map(async (registration) => {
                const registeredModel = registeredModels.find(
                    ({ rdfsClasses }) =>
                        !!registration.instanceContainer &&
                        rdfsClasses.some((rdfsClass) => registration.forClass.includes(rdfsClass)),
                );

                if (!registeredModel || !registration.instanceContainer) {
                    return;
                }

                const remoteClass = getRemoteClass(registeredModel.modelClass);

                if (isContainerClass(remoteClass)) {
                    await trackModelsCollection(
                        registeredModel.modelClass,
                        requireUrlParentDirectory(registration.instanceContainer),
                    );

                    const container = await remoteClass.find(registration.instanceContainer);

                    container && (await this.loadChildren(container));

                    return container;
                }

                await trackModelsCollection(registeredModel.modelClass, registration.instanceContainer);

                return remoteClass.from(registration.instanceContainer).all();
            }),
        );

        return completeRemoteModels(this.rootLocalModels, arrayFilter(remoteModels).flat());
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

        const typeIndex = await this.getTypeIndex({ create: true });

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

    protected async loadContainedModels(model: SolidContainer): Promise<SolidModel[]> {
        if (!isRemoteModel(model)) {
            const children = [];

            for (const relation of getContainerRelations(model.static())) {
                const relationModels =
                    (await model.loadRelationIfUnloaded<SolidModel | SolidModel[] | null>(relation)) ?? [];

                children.push(...arrayFrom(relationModels));
            }

            return children;
        }

        const children: Record<string, SolidModel[]> = {};
        const documents = map(model.documents, 'url');

        for (const documentUrl of model.resourceUrls) {
            const documentChildren = await this.loadDocumentChildren(model, documentUrl, documents);

            for (const [relation, documentModels] of Object.entries(documentChildren)) {
                const relationChildren = (children[relation] ??= []);

                relationChildren.push(...documentModels);
            }
        }

        for (const [relation, relationModels] of Object.entries(children)) {
            model.setRelationModels(relation, relationModels);
        }

        return Object.values(children).flat();
    }

    protected async loadDocumentChildren(
        model: SolidModel,
        documentUrl: string,
        documents: ObjectsMap<SolidDocument>,
    ): Promise<Record<string, SolidModel[]>> {
        const document = documents.get(documentUrl);

        if (
            document &&
            (await DocumentsCache.isFresh(document.url, document.updatedAt ?? new Date())) &&
            this.localModels.hasKey(model.url)
        ) {
            return this.loadDocumentChildrenFromLocal(model, document);
        }

        return this.loadDocumentChildrenFromRemote(model, documentUrl);
    }

    protected async loadDocumentChildrenFromLocal(
        model: SolidModel,
        document: SolidDocument,
    ): Promise<Record<string, SolidModel[]>> {
        const children: Record<string, SolidModel[]> = {};

        for (const relation of getContainerRelations(model.static())) {
            const relationInstance = model.requireRelation<SolidContainsRelation>(relation);

            if (relationInstance.loaded) {
                children[relation] = relationInstance.getLoadedModels();

                continue;
            }

            const relatedLocalModels = this.localModels.get(model.url)?.getRelationModels(relation) ?? [];

            children[relation] = relatedLocalModels
                .filter((relatedLocalModel) => relatedLocalModel.getDocumentUrl() === document.url)
                .map((relatedLocalModel) => cloneLocalModel(relatedLocalModel, { clean: true }));
        }

        return children;
    }

    protected async loadDocumentChildrenFromRemote(
        model: SolidModel,
        documentUrl: string,
    ): Promise<Record<string, SolidModel[]>> {
        const children: Record<string, SolidModel[]> = {};
        const document = lazy(() => model.requireEngine().readOne(model.static('collection'), documentUrl));

        for (const relation of getContainerRelations(model.static())) {
            const relationInstance = model.requireRelation<SolidContainsRelation>(relation);

            if (relationInstance.loaded) {
                children[relation] = relationInstance.getLoadedModels();

                continue;
            }

            const documentChildren = await relationInstance.relatedClass.createManyFromEngineDocuments({
                [documentUrl]: await document(),
            });

            children[relation] = documentChildren;
        }

        if (!documentUrl.endsWith('/')) {
            // For now, we're only caching non-container documents, given that not all POD providers
            // will update a container's modification date when a child document is changed.
            DocumentsCache.remember(documentUrl, new Date());
        }

        return children;
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

    private async reconcileInconsistencies(localModel: SolidModel, remoteModel: SolidModel): Promise<void> {
        localModel.rebuildAttributesFromHistory();
        localModel.setAttributes(remoteModel.getAttributes());

        getSameDocumentRelations(localModel.static()).forEach((relation) => {
            const localRelationModels = localModel.getRelationModels(relation) ?? [];
            const remoteRelationModels = map(remoteModel.getRelationModels(relation) ?? [], 'url');

            localRelationModels.forEach((localRelatedModel) => {
                if (!localRelatedModel.isRelationLoaded('operations')) {
                    return;
                }

                localRelatedModel.rebuildAttributesFromHistory();
                localRelatedModel.setAttributes(remoteRelationModels.get(localRelatedModel.url)?.getAttributes() ?? {});
            });
        });

        for (const relation of getContainerRelations(localModel.static())) {
            await this.synchronizeContainerDocuments(
                localModel.requireRelation<SolidContainsRelation>(relation),
                remoteModel.requireRelation<SolidContainsRelation>(relation),
            );
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
