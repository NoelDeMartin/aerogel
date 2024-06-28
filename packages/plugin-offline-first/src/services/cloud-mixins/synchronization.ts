import { arrayEquals, arrayFilter, arrayFrom, map, objectWithout } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidContainer, SolidModel, Tombstone, isContainer, isContainerClass } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainsRelation, SolidTypeIndex } from 'soukai-solid';

import type { CloudService } from '@/services/Cloud';

export default class CloudSynchronization {

    protected typeIndex?: SolidTypeIndex | null;

    protected async getTypeIndex(): Promise<SolidTypeIndex | null> {
        if (this.typeIndex === undefined) {
            this.typeIndex = await Solid.findPrivateTypeIndex();
        }

        return this.typeIndex;
    }

    protected async pullChanges(this: CloudService, localModel?: SolidModel): Promise<void> {
        const localModels = map(localModel ? [localModel] : this.getLocalModels(), 'url');
        const remoteModelsArray = localModel
            ? await this.fetchRemoteModelsForLocal(localModel)
            : await this.fetchRemoteModels(localModels.getItems());
        const remoteModels = map(remoteModelsArray, (model) => {
            if (model instanceof Tombstone) {
                return model.resourceUrl;
            }

            return model.url;
        });

        await this.synchronizeModels(localModels, remoteModels);

        this.setState({
            dirtyRemoteModels: map(
                remoteModels.getItems().filter((model) => this.isDirtyOrHasDirtyChildren(model)),
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

    protected async pushChanges(this: CloudService, localModel?: SolidModel): Promise<void> {
        const remoteModels = this.dirtyRemoteModels
            .getItems()
            .filter((model) => !localModel || model.url === localModel.url);

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

        this.setState({
            dirtyRemoteModels: localModel
                ? this.dirtyRemoteModels.filter((_, url) => url !== localModel.url)
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
            }, this.remoteOperationUrls),
            localModelUpdates: localModel ? objectWithout(this.localModelUpdates, localModel.url) : {},
        });
    }

    protected async fetchRemoteModels(this: CloudService, localModels: SolidModel[]): Promise<SolidModel[]> {
        const typeIndex = await this.getTypeIndex();

        if (!typeIndex) {
            return [];
        }

        const registeredModels = [...this.registeredModels].map((modelClass) => {
            const registeredChildren = isContainerClass(modelClass)
                ? this.getContainerRegisteredClasses(modelClass)
                : [];

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
                        arrayEquals(rdfsClasses, registration.forClass) && !!registration.instanceContainer,
                );

                if (!registeredModel) {
                    return;
                }

                const remoteClass = this.getRemoteClass(registeredModel.modelClass);

                if (!registration.instanceContainer) {
                    return null;
                }

                if (isContainerClass(remoteClass)) {
                    const container = await remoteClass.find(registration.instanceContainer);

                    container && (await this.loadChildren(container));

                    return container;
                }

                return remoteClass.from(registration.instanceContainer).all();
            }),
        );

        return this.completeRemoteModels(localModels, arrayFilter(remoteModels).flat());
    }

    protected async fetchRemoteModelsForLocal(this: CloudService, localModel: SolidModel): Promise<SolidModel[]> {
        const remoteModel = await this.getRemoteClass(localModel.static()).find(localModel.url);

        return this.completeRemoteModels([localModel], arrayFilter([remoteModel]));
    }

    protected async updateTypeRegistrations(this: CloudService, remoteModel: SolidModel): Promise<void> {
        if (!isContainer(remoteModel) || !this.isRegisteredModel(remoteModel)) {
            return;
        }

        const registeredChildren = this.getContainerRegisteredClasses(remoteModel.static());

        if (registeredChildren.length === 0) {
            return;
        }

        this.typeIndex ??= await Solid.findOrCreatePrivateTypeIndex();

        if (this.typeIndex.registrations.some((registration) => registration.instanceContainer === remoteModel.url)) {
            return;
        }

        await remoteModel.register(this.typeIndex, registeredChildren);
    }

    protected async loadChildren(this: CloudService, model: SolidModel): Promise<void> {
        if (!(model instanceof SolidContainer)) {
            return;
        }

        for (const relation of this.getContainerRelations(model.static())) {
            const children = arrayFilter(arrayFrom(await model.loadRelationIfUnloaded(relation)));

            for (const child of children) {
                await this.loadChildren(child as SolidModel);
            }
        }
    }

    protected async saveModelAndChildren(this: CloudService, model: SolidModel): Promise<void> {
        if (model.isSoftDeleted()) {
            model.enableHistory();
            model.enableTombstone();
            await model.delete();

            return;
        }

        model.save();

        if (!(model instanceof SolidContainer)) {
            return;
        }

        const children = this.getContainerRelations(model.static())
            .map((relation) => model.getRelationModels(relation) ?? [])
            .flat();

        for (const child of children) {
            await this.saveModelAndChildren(child);
        }
    }

    protected async synchronizeModels(
        this: CloudService,
        localModels: ObjectsMap<SolidModel>,
        remoteModels: ObjectsMap<SolidModel>,
    ): Promise<void> {
        const synchronizedModelUrls = new Set<string>();

        for (const remoteModel of remoteModels.items()) {
            if (remoteModel instanceof Tombstone) {
                const localModel = localModels.get(remoteModel.resourceUrl);

                if (localModel) {
                    await localModel.delete();

                    synchronizedModelUrls.add(remoteModel.resourceUrl);
                }

                continue;
            }

            const localModel = this.getLocalModel(remoteModel, localModels);

            await this.loadChildren(localModel);
            await SolidModel.synchronize(localModel, remoteModel);
            await this.reconcileInconsistencies(localModel, remoteModel);
            await this.saveModelAndChildren(localModel);

            localModels.add(localModel);
            synchronizedModelUrls.add(localModel.url);
        }

        for (const [url, localModel] of localModels) {
            if (synchronizedModelUrls.has(url)) {
                continue;
            }

            await this.loadChildren(localModel);

            const remoteModel = this.getRemoteModel(localModel, remoteModels);

            await SolidModel.synchronize(localModel, remoteModel);

            remoteModels.add(remoteModel);
        }
    }

    private async reconcileInconsistencies(
        this: CloudService,
        localModel: SolidModel,
        remoteModel: SolidModel,
    ): Promise<void> {
        localModel.rebuildAttributesFromHistory();
        localModel.setAttributes(remoteModel.getAttributes());

        this.getSameDocumentRelations(localModel.static()).forEach((relation) => {
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

        for (const relation of this.getContainerRelations(localModel.static())) {
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
        this: CloudService,
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
            const remoteModel = this.cloneLocalModel(localModel);

            remoteRelation.addRelated(remoteModel);
            remoteModels.add(remoteModel);
        }

        for (const url of newRemoteModelUrls) {
            const remoteModel = remoteModels.require(url);
            const localModel = this.cloneRemoteModel(remoteModel);

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
