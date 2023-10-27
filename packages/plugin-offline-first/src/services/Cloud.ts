import {
    Metadata,
    Operation,
    SolidACLAuthorization,
    SolidContainer,
    SolidModel,
    Tombstone,
    isSolidDocumentRelation,
} from 'soukai-solid';
import {
    Semaphore,
    after,
    arrayChunk,
    arrayFilter,
    facade,
    fail,
    isInstanceOf,
    map,
    objectWithout,
    tap,
} from '@noeldemartin/utils';
import { Errors, Events, translateWithDefault } from '@aerogel/core';
import { Solid } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModelConstructor } from 'soukai-solid';
import type { Engine } from 'soukai';

import Service, { CloudStatus } from './Cloud.state';
import { getLocalClass, getRemoteClass } from './utils';

const MAX_REQUESTS_CHUNK_SIZE = 10;

export interface CloudHandlerConfig<T extends SolidModel = SolidModel> {
    modelClass: SolidModelConstructor<T>;
    getLocalModels(): T[];
    initialize?(): Promise<void>;
    beforeDeletingModel?(model: T): Promise<void>;
    mendRemoteModel?(model: T): void;
    foundModelUsingRdfAliases?(): void;
}

export class CloudService extends Service {

    protected static sameDocumentRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();

    protected asyncLock: Semaphore = new Semaphore();
    protected handlers: Map<SolidModelConstructor, CloudHandlerConfig> = new Map();
    protected engine: Engine | null = null;

    protected async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('login', ({ authenticator }) => this.login(authenticator));
        Events.on('logout', () => this.logout());
    }

    public async syncIfOnline(model?: SolidModel): Promise<void> {
        if (!this.online) {
            return;
        }

        await this.sync(model);
    }

    public async sync(model?: SolidModel): Promise<void> {
        if (!Solid.loggedIn) {
            return;
        }

        await this.asyncLock.run(async () => {
            const start = Date.now();

            this.status = CloudStatus.Syncing;

            try {
                // TODO subscribe to server events instead of pulling remote on every sync
                await this.pullChanges(model);
                await this.pushChanges(model);

                await after({ milliseconds: Math.max(0, 1000 - (Date.now() - start)) });
            } catch (error) {
                Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;
            }
        });
    }

    public async registerHandler<T extends SolidModel>(handler: CloudHandlerConfig<T>): Promise<void> {
        await handler.initialize?.();

        this.engine && getRemoteClass(handler.modelClass).setEngine(this.engine);

        this.handlers.set(handler.modelClass, handler);

        handler.modelClass.on('created', (model) => this.createRemoteModel(model));
        handler.modelClass.on('updated', (model) => this.updateRemoteModel(model));
    }

    protected getLocalModels(): Iterable<SolidModel> {
        return [...this.handlers.values()].map((handler) => handler.getLocalModels()).flat();
    }

    protected getLocalModel(remoteModel: SolidModel, localModels: ObjectsMap<SolidModel>): SolidModel {
        return localModels.get(remoteModel.url) ?? this.cloneRemoteModel(remoteModel);
    }

    protected getRemoteModel(localModel: SolidModel, remoteModels: ObjectsMap<SolidModel>): SolidModel {
        return remoteModels.get(localModel.url) ?? this.cloneLocalModel(localModel);
    }

    protected getSameDocumentRelations(modelClass: typeof SolidModel): string[] {
        if (!CloudService.sameDocumentRelations.has(modelClass)) {
            CloudService.sameDocumentRelations.set(
                modelClass,
                modelClass.relations.filter((relation) => {
                    if (SolidModel.reservedRelations.includes(relation)) {
                        return false;
                    }

                    const relationInstance = modelClass.instance().requireRelation(relation);

                    return isSolidDocumentRelation(relationInstance) && relationInstance.useSameDocument;
                }),
            );
        }

        return CloudService.sameDocumentRelations.get(modelClass) ?? [];
    }

    protected cloneLocalModel(localModel: SolidModel): SolidModel {
        const localClass = localModel.static();
        const remoteClass = getRemoteClass(localModel.static());

        return tap(localModel.clone({ constructors: [[localClass, remoteClass]] }), (model) => {
            this.cleanRemoteModel(model);
        });
    }

    protected cloneRemoteModel(remoteModel: SolidModel): SolidModel {
        const remoteClass = remoteModel.static();
        const localClass = getLocalClass(remoteClass);

        for (const modelClass of this.handlers.keys()) {
            if (modelClass !== localClass) {
                continue;
            }

            this.handlers.get(modelClass)?.mendRemoteModel?.(remoteModel);

            break;
        }

        return remoteModel.clone({ constructors: [[remoteClass, localClass]] });
    }

    protected cleanRemoteModel(remoteModel: SolidModel): void {
        const remoteOperationUrls = this.remoteOperationUrls[remoteModel.url];

        if (!remoteOperationUrls) {
            return;
        }

        const relatedModels = remoteModel
            .getRelatedModels()
            .filter(
                (model) =>
                    !isInstanceOf(model, SolidACLAuthorization) &&
                    !isInstanceOf(model, Metadata) &&
                    !isInstanceOf(model, Operation),
            );

        for (const relatedModel of relatedModels) {
            const operations = relatedModel.operations ?? [];

            relatedModel.setRelationModels(
                'operations',
                operations.filter((operation) => {
                    if (!remoteOperationUrls.includes(operation.url)) return false;

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

    protected async reconcileInconsistencies(localModel: SolidModel, remoteModel: SolidModel): Promise<void> {
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

        if (localModel.isDirty()) {
            await localModel.save();
            await SolidModel.synchronize(localModel, remoteModel);
        }
    }

    protected login(authenticator: Authenticator): void {
        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;

        getRemoteClass(Tombstone).setEngine(this.requireEngine());

        for (const modelClass of this.handlers.keys()) {
            getRemoteClass(modelClass).setEngine(this.engine);
        }
    }

    protected logout(): void {
        this.setState({
            status: CloudStatus.Disconnected,
            dirtyRemoteModels: map([], 'url'),
            localModelUpdates: {},
            remoteOperationUrls: {},
        });
    }

    protected requireEngine(): Engine {
        return this.engine ?? fail('Could not get required Engine');
    }

    protected async pullChanges(localModel?: SolidModel): Promise<void> {
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
                remoteModels.getItems().filter((model) => model.isDirty()),
                'url',
            ),
            remoteOperationUrls: remoteModels.getItems().reduce((urls, model) => {
                urls[model.url] = model
                    .getRelatedModels()
                    .map((related) => related.operations ?? [])
                    .flat()
                    .map((operation) => operation.url);

                return urls;
            }, {} as Record<string, string[]>),
        });
    }

    protected async pushChanges(localModel?: SolidModel): Promise<void> {
        const remoteModels = this.dirtyRemoteModels
            .getItems()
            .filter((model) => !localModel || model.url === localModel.url);

        await Promise.all(
            remoteModels.map(async (remoteModel) => {
                if (remoteModel.isSoftDeleted()) {
                    remoteModel.enableHistory();
                    remoteModel.enableTombstone();
                    await remoteModel.delete();

                    return;
                }

                await remoteModel.save();
            }),
        );

        this.setState({
            dirtyRemoteModels: localModel
                ? this.dirtyRemoteModels.filter((_, url) => url !== localModel.url)
                : map([], 'url'),
            remoteOperationUrls: remoteModels.reduce((urls, model) => {
                urls[model.url] = model
                    .getRelatedModels()
                    .map((related) => related.operations ?? [])
                    .flat()
                    .map((operation) => operation.url);

                return urls;
            }, this.remoteOperationUrls),
            localModelUpdates: localModel ? objectWithout(this.localModelUpdates, localModel.url) : {},
        });
    }

    protected async fetchRemoteModels(localModels: SolidModel[]): Promise<SolidModel[]> {
        const handlersModels = await Promise.all(
            [...this.handlers.entries()].map(async ([modelClass, handler]) => {
                const remoteModels = [];
                const remoteClass = getRemoteClass(modelClass);
                const recipeContainers = new Set([remoteClass.collection]);
                const loadedContainers = new Set();

                while (recipeContainers.size > loadedContainers.size) {
                    const containerUrl = [...recipeContainers].find((url) => !loadedContainers.has(url));
                    const container = await SolidContainer.withEngine(this.requireEngine()).find(containerUrl);

                    loadedContainers.add(containerUrl);

                    if (!container) continue;

                    const resourceUrls = container.resourceUrls.filter((url) => {
                        const isContainer = url.endsWith('/');

                        if (isContainer) {
                            recipeContainers.add(url);
                        }

                        return !isContainer;
                    });
                    const urlChunks = arrayChunk(
                        resourceUrls.filter((url) => !/\.(jpe?|pn)g$/.test(url)),
                        MAX_REQUESTS_CHUNK_SIZE,
                    );

                    for (const urls of urlChunks) {
                        const chunkModels = await remoteClass.all({ $in: urls });

                        if (chunkModels.some((model) => model.usesRdfAliases())) {
                            handler.foundModelUsingRdfAliases?.();
                        }

                        remoteModels.push(...chunkModels);
                    }
                }

                return remoteModels;
            }),
        );

        return this.completeRemoteModels(localModels, handlersModels.flat());
    }

    protected async fetchRemoteModelsForLocal(localModel: SolidModel): Promise<SolidModel[]> {
        const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);

        return this.completeRemoteModels([localModel], arrayFilter([remoteModel]));
    }

    protected async completeRemoteModels(localModels: SolidModel[], remoteModels: SolidModel[]): Promise<SolidModel[]> {
        const RemoteTombstone = getRemoteClass(Tombstone);
        const remoteModelUrls = remoteModels.map((remoteModel) => remoteModel.url);
        const missingModelDocumentUrls = localModels
            .filter((localModel) => !remoteModelUrls.includes(localModel.url))
            .map((localModel) => localModel.requireDocumentUrl());
        const tombstones = await RemoteTombstone.all({ $in: missingModelDocumentUrls });

        return remoteModels.concat(tombstones);
    }

    protected async synchronizeModels(
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

            await SolidModel.synchronize(localModel, remoteModel);
            await this.reconcileInconsistencies(localModel, remoteModel);
            await localModel.save();

            localModels.add(localModel);
            synchronizedModelUrls.add(localModel.url);
        }

        for (const [url, localModel] of localModels) {
            if (synchronizedModelUrls.has(url)) {
                continue;
            }

            const remoteModel = this.getRemoteModel(localModel, remoteModels);

            await SolidModel.synchronize(localModel, remoteModel);

            remoteModels.add(remoteModel);
        }
    }

    protected createRemoteModel(localModel: SolidModel): void {
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
    }

    protected async updateRemoteModel(localModel: SolidModel): Promise<void> {
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
    }

}

export default facade(new CloudService());
