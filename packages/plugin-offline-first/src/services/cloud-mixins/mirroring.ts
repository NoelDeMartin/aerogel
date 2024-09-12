import { bootModels } from 'soukai';
import {
    after,
    arrayRemove,
    fail,
    isInstanceOf,
    map,
    objectWithout,
    requireUrlParentDirectory,
    tap,
    urlResolveDirectory,
} from '@noeldemartin/utils';
import { getTrackedModels } from '@aerogel/plugin-soukai';
import { Solid } from '@aerogel/plugin-solid';
import {
    Metadata,
    Operation,
    SolidACLAuthorization,
    SolidContainer,
    SolidContainsRelation,
    SolidModel,
    Tombstone,
    isContainer,
} from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { Attributes } from 'soukai';
import type { SolidModelConstructor } from 'soukai-solid';

import type { CloudService } from '@/services/Cloud';

export default class CloudMirroring {

    private remoteClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
    private localClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
    private autoPushModels: Set<SolidModel> = new Set();
    private autoPushPromises: Promise<unknown>[] = [];

    public async autoPushAfter<T = void>(
        this: CloudService,
        operationOrPromise: Promise<T> | (() => Promise<T>),
    ): Promise<T> {
        const enabled = this.autoPush && this.ready;
        const promise = typeof operationOrPromise === 'function' ? operationOrPromise() : operationOrPromise;

        if (!enabled) {
            return promise;
        }

        this.autoPushPromises.push(promise);

        promise.then(() => arrayRemove(this.autoPushPromises, promise));

        if (this.autoPushPromises.length === 1) {
            this.scheduleAutoPush();
        }

        return promise as Promise<T>;
    }

    protected async createRemoteModel(this: CloudService, localModel: SolidModel): Promise<void> {
        const remoteModel = this.cloneLocalModel(localModel);
        const dirtyRemoteModels = map(this.dirtyRemoteModels.getItems(), 'url');

        dirtyRemoteModels.add(remoteModel);

        this.setState({
            dirtyRemoteModels,
            localModelUpdates: {
                ...this.localModelUpdates,
                [localModel.url]: 1,
            },
        });

        if (this.isRegisteredModelClass(localModel.static())) {
            await this.trackModelsCollection(
                localModel.static(),
                isContainer(localModel)
                    ? requireUrlParentDirectory(localModel.url)
                    : urlResolveDirectory(localModel.url),
            );
        }

        this.autoPushModel(localModel);
    }

    protected async updateRemoteModel(this: CloudService, localModel: SolidModel): Promise<void> {
        if (isContainer(localModel)) {
            return;
        }

        const remoteModel = this.getRemoteModel(localModel, this.dirtyRemoteModels);
        const modelUpdates = this.localModelUpdates[localModel.url] ?? 0;

        await SolidModel.synchronize(localModel, remoteModel);

        if (!this.dirtyRemoteModels.hasKey(remoteModel.url)) {
            const dirtyRemoteModels = map(this.dirtyRemoteModels.getItems(), 'url');

            dirtyRemoteModels.add(remoteModel);

            this.setState({ dirtyRemoteModels });
        }

        this.setState({
            localModelUpdates: localModel.isSoftDeleted()
                ? objectWithout(this.localModelUpdates, localModel.url)
                : {
                    ...this.localModelUpdates,
                    [localModel.url]: modelUpdates + 1,
                },
        });

        this.autoPushModel(localModel);
    }

    protected cloneLocalModel(this: CloudService, localModel: SolidModel): SolidModel {
        const localModelClasses = new Set<typeof SolidModel>();

        localModelClasses.add(localModel.static());

        if (localModel instanceof SolidContainer) {
            for (const relation of this.getContainerRelations(localModel.static())) {
                localModelClasses.add(localModel.requireRelation<SolidContainsRelation>(relation).relatedClass);
            }
        }

        const constructors = [...localModelClasses.values()].map(
            (localClass) => [localClass, this.getRemoteClass(localClass)] as [typeof SolidModel, typeof SolidModel],
        );

        return tap(localModel.clone({ constructors }), (model) => {
            this.cleanRemoteModel(model);
        });
    }

    protected cloneRemoteModel(this: CloudService, remoteModel: SolidModel): SolidModel {
        const remoteModelClasses = new Set<typeof SolidModel>();

        remoteModelClasses.add(remoteModel.static());

        if (remoteModel instanceof SolidContainer) {
            for (const relation of this.getContainerRelations(remoteModel.static())) {
                remoteModelClasses.add(remoteModel.requireRelation<SolidContainsRelation>(relation).relatedClass);
            }
        }

        const constructors = [...remoteModelClasses.values()].map(
            (remoteClass) => [remoteClass, this.getLocalClass(remoteClass)] as [typeof SolidModel, typeof SolidModel],
        );

        return remoteModel.clone({ constructors });
    }

    protected async completeRemoteModels(localModels: SolidModel[], remoteModels: SolidModel[]): Promise<SolidModel[]> {
        const RemoteTombstone = this.getRemoteClass(Tombstone);
        const remoteModelUrls = remoteModels.map((remoteModel) => remoteModel.url);
        const missingModelDocumentUrls = localModels
            .filter((localModel) => !remoteModelUrls.includes(localModel.url))
            .map((localModel) => localModel.requireDocumentUrl());
        const tombstones = await RemoteTombstone.all({ $in: missingModelDocumentUrls });

        return remoteModels.concat(tombstones);
    }

    protected getLocalModel(
        this: CloudService,
        remoteModel: SolidModel,
        localModels: ObjectsMap<SolidModel>,
    ): SolidModel {
        return localModels.get(remoteModel.url) ?? this.cloneRemoteModel(remoteModel);
    }

    protected getLocalModels(this: CloudService): SolidModel[] {
        return [...this.registeredModels].map(({ modelClass }) => getTrackedModels(modelClass)).flat();
    }

    protected getRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
        return (this.remoteClasses.get(localClass) as T) ?? this.makeRemoteClass(localClass);
    }

    protected getRemoteContainersCollection(path?: string): string {
        const rootStorage = Solid.requireUser().storageUrls[0];

        return path
            ? urlResolveDirectory((path.startsWith('/') ? rootStorage.slice(0, -1) : rootStorage) + path)
            : rootStorage;
    }

    protected getRemoteModel(
        this: CloudService,
        localModel: SolidModel,
        remoteModels: ObjectsMap<SolidModel>,
    ): SolidModel {
        return remoteModels.get(localModel.url) ?? this.cloneLocalModel(localModel);
    }

    protected isRegisteredModel(this: CloudService, model: SolidModel): boolean {
        for (const { modelClass } of this.registeredModels) {
            const models = getTrackedModels(modelClass);

            if (models.some((registeredModel) => registeredModel.url === model.url)) {
                return true;
            }
        }

        return false;
    }

    protected isRemoteModel(this: CloudService, model: SolidModel): boolean {
        return this.localClasses.has(model.static());
    }

    protected isRegisteredModelClass(this: CloudService, modelClass: SolidModelConstructor): boolean {
        return this.registeredModels.some(
            ({ modelClass: registeredModelClass }) => registeredModelClass === modelClass,
        );
    }

    private makeRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
        const self = this;
        const LocalClass = localClass as typeof SolidModel;
        const withLocalHistoryConfig = (modelClass: typeof SolidModel, operation: () => unknown) => {
            modelClass.timestamps = LocalClass.timestamps;
            modelClass.history = LocalClass.history;

            operation();

            modelClass.timestamps = [];
            modelClass.history = false;
        };
        const RemoteClass = class extends LocalClass {

            public static timestamps = false;
            public static history = false;

            protected initialize(attributes: Attributes, exists: boolean): void {
                withLocalHistoryConfig(this._proxy.static(), () => super.initialize(attributes, exists));
            }

            protected initializeRelations(): void {
                super.initializeRelations();

                for (const relation of Object.values(this._relations)) {
                    if (!(relation instanceof SolidContainsRelation)) {
                        continue;
                    }

                    relation.relatedClass = self.getRemoteClass(relation.relatedClass);
                }
            }

            public fixMalformedAttributes(): void {
                withLocalHistoryConfig(this.static(), () => super.fixMalformedAttributes());
            }
        
        } as unknown as T;

        this.remoteClasses.set(LocalClass, RemoteClass);
        this.localClasses.set(RemoteClass, LocalClass);

        bootModels({ [`Remote${localClass.modelName}`]: RemoteClass });

        return RemoteClass;
    }

    private cleanRemoteModel(this: CloudService, remoteModel: SolidModel): void {
        const remoteOperationUrls = this.remoteOperationUrls[remoteModel.url];

        if (!remoteOperationUrls) {
            return;
        }

        const relatedModels = remoteModel
            .getRelatedModels()
            .filter(
                (model) =>
                    !isInstanceOf(model, SolidACLAuthorization) &&
                    !isInstanceOf(model, SolidContainer) &&
                    !isInstanceOf(model, Metadata) &&
                    !isInstanceOf(model, Operation),
            );

        for (const relatedModel of relatedModels) {
            const operations = relatedModel.operations ?? [];

            relatedModel.setRelationModels(
                'operations',
                operations.filter((operation) => {
                    if (!remoteOperationUrls.includes(operation.url)) {
                        return false;
                    }

                    operation.cleanDirty(true);

                    return true;
                }),
            );
            relatedModel.rebuildAttributesFromHistory();
            relatedModel.cleanDirty(true);
            relatedModel.metadata.cleanDirty(true);

            relatedModel.setRelationModels('operations', operations);
            relatedModel.rebuildAttributesFromHistory();
        }
    }

    private getLocalClass<T extends SolidModelConstructor>(remoteClass: T): T {
        return (
            (this.localClasses.get(remoteClass) as T) ?? fail(`Couldn't find local class for ${remoteClass.modelName}`)
        );
    }

    private scheduleAutoPush(this: CloudService): void {
        Promise.all(this.autoPushPromises)
            .then(() => after())
            .then(() => {
                if (this.autoPushPromises.length !== 0) {
                    this.scheduleAutoPush();

                    return;
                }

                this.syncIfOnline(this.consumeAutoPushModels());
            });
    }

    private autoPushModel(this: CloudService, model: SolidModel): void {
        if (!this.autoPush || !this.ready) {
            return;
        }

        this.autoPushModels.add(model);
        this.autoPushAfter(after({ seconds: 1 }));
    }

    private consumeAutoPushModels(this: CloudService): SolidModel[] {
        const models: SolidModel[] = [];
        const children: Set<SolidModel> = new Set();

        for (const model of this.autoPushModels) {
            if (!isContainer(model)) {
                continue;
            }

            this.autoPushModels.delete(model);
            this.getContainedModels(model).forEach((child) => children.add(child));
            models.push(model);
        }

        for (const model of this.autoPushModels) {
            this.autoPushModels.delete(model);

            if (children.has(model)) {
                continue;
            }

            models.push(model);
        }

        return models;
    }

}
