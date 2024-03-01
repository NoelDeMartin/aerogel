import {
    Metadata,
    Operation,
    SolidACLAuthorization,
    SolidContainer,
    SolidContainsRelation,
    SolidModel,
    Tombstone,
    isSolidDocumentRelation,
} from 'soukai-solid';
import {
    Semaphore,
    after,
    arrayEquals,
    arrayFilter,
    arrayFrom,
    facade,
    fail,
    isInstanceOf,
    map,
    objectWithout,
    tap,
} from '@noeldemartin/utils';
import { Errors, Events, dispatch, translateWithDefault } from '@aerogel/core';
import { expandIRI } from '@noeldemartin/solid-utils';
import { Solid } from '@aerogel/plugin-solid';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModelConstructor, SolidTypeIndex } from 'soukai-solid';
import type { Engine } from 'soukai';

import MigrateLocalDocuments from '@/jobs/MigrateLocalDocuments';

import Service, { CloudStatus } from './Cloud.state';
import { getLocalClass, getRemoteClass } from './utils';
import type { CloudHandlerConfig } from './Cloud.state';

export class CloudService extends Service {

    protected static sameDocumentRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();
    protected static containerRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();

    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected typeIndex?: SolidTypeIndex | null;

    public async whenReady<T>(callback: () => T): Promise<T> {
        if (this.ready) {
            return callback();
        }

        return new Promise((resolve) => {
            const onReady = () => resolve(callback());

            Events.once('cloud:ready', onReady);
        });
    }

    public async setup(): Promise<void> {
        const job = new MigrateLocalDocuments();

        for (const handler of [...this.handlers.values()]) {
            if (!handler.getRemoteCollection) {
                continue;
            }

            const localCollection = handler.modelClass.collection;
            const remoteCollection = handler.getRemoteCollection();

            handler.modelClass.collection = remoteCollection;

            job.migrateCollection(localCollection, remoteCollection);
        }

        await dispatch(job);
        await Events.emit('cloud:migrated');
        await this.setReady(true);
        await this.sync();
    }

    public dismissSetup(): void {
        this.setupDismissed = true;
    }

    public async syncIfOnline(model?: SolidModel): Promise<void> {
        if (!this.online) {
            return;
        }

        await this.sync(model);
    }

    public async sync(model?: SolidModel): Promise<void> {
        if (!Solid.isLoggedIn() || !this.ready) {
            return;
        }

        await this.asyncLock.run(async () => {
            const start = Date.now();

            this.status = CloudStatus.Syncing;

            Events.emit('cloud:sync-started');

            try {
                await this.pullChanges(model);
                await this.pushChanges(model);
                await after({ milliseconds: Math.max(0, 1000 - (Date.now() - start)) });
            } catch (error) {
                await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;

                Events.emit('cloud:sync-completed');
            }
        });
    }

    public async registerHandler<T extends SolidModel>(handler: CloudHandlerConfig<T>): Promise<void> {
        const engine = this.engine;

        if (engine) {
            this.getRelatedClasses(handler).forEach((modelClass) => getRemoteClass(modelClass).setEngine(engine));
        }

        this.whenReady(() => {
            if (!handler.getRemoteCollection) {
                return;
            }

            handler.modelClass.collection = handler.getRemoteCollection();
        });

        this.handlers.set(handler.modelClass, handler);
        handler.modelClass.on('created', (model) => this.createRemoteModel(model));
        handler.modelClass.on('updated', (model) => this.updateRemoteModel(model));
    }

    protected async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('login', ({ authenticator }) => this.login(authenticator));
        Events.on('logout', () => this.logout());
        Events.once('application-ready', () => this.autoSetup());
        Events.once('application-mounted', () => this.sync());
    }

    protected async setReady(ready: boolean): Promise<void> {
        if (this.ready || !ready) {
            return;
        }

        await Events.emit('cloud:ready');

        this.ready = true;
    }

    protected getLocalModels(): SolidModel[] {
        return [...this.handlers.values()].map((handler) => handler.getLocalModels()).flat();
    }

    protected getLocalModel(remoteModel: SolidModel, localModels: ObjectsMap<SolidModel>): SolidModel {
        return localModels.get(remoteModel.url) ?? this.cloneRemoteModel(remoteModel);
    }

    protected getRemoteModel(localModel: SolidModel, remoteModels: ObjectsMap<SolidModel>): SolidModel {
        return remoteModels.get(localModel.url) ?? this.cloneLocalModel(localModel);
    }

    protected getRelatedClasses(handler: CloudHandlerConfig): SolidModelConstructor[] {
        const relatedClasses = new Set<SolidModelConstructor>();
        const instance = handler.modelClass.instance();

        relatedClasses.add(handler.modelClass);

        for (const relation of handler.modelClass.relations) {
            if (handler.modelClass.reservedRelations.includes(relation)) {
                continue;
            }

            relatedClasses.add(instance.requireRelation(relation).relatedClass);
        }

        return [...relatedClasses.values()];
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

    protected async loadChildren(model: SolidModel): Promise<void> {
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

    protected async saveModelAndChildren(model: SolidModel): Promise<void> {
        await model.save();

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

    protected getContainerRelations(modelClass: typeof SolidModel): string[] {
        if (!CloudService.containerRelations.has(modelClass)) {
            CloudService.containerRelations.set(
                modelClass,
                modelClass.relations.filter((relation) => {
                    if (SolidModel.reservedRelations.includes(relation)) {
                        return false;
                    }

                    const relationInstance = modelClass.instance().requireRelation(relation);

                    return relationInstance instanceof SolidContainsRelation;
                }),
            );
        }

        return CloudService.containerRelations.get(modelClass) ?? [];
    }

    protected isDirtyOrHasDirtyChildren(model: SolidModel): boolean {
        if (model.isDirty()) {
            return true;
        }

        if (!(model instanceof SolidContainer)) {
            return false;
        }

        const relationHasDirtyModels = (relation: string) => {
            return model
                .getRelationModels(relation)
                ?.some((relatedModel) => this.isDirtyOrHasDirtyChildren(relatedModel));
        };

        return this.getContainerRelations(model.static()).some(relationHasDirtyModels);
    }

    protected async autoSetup(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        await this.setReady(!this.getLocalModels().some((model) => model.url.startsWith('solid://')));
    }

    protected async getTypeIndex(): Promise<SolidTypeIndex | null> {
        if (this.typeIndex === undefined) {
            this.typeIndex = await Solid.findPrivateTypeIndex();
        }

        return this.typeIndex;
    }

    protected cloneLocalModel(localModel: SolidModel): SolidModel {
        const localClasses = new Set<typeof SolidModel>();

        localClasses.add(localModel.static());

        if (localModel instanceof SolidContainer) {
            for (const relation of this.getContainerRelations(localModel.static())) {
                localClasses.add(localModel.requireRelation<SolidContainsRelation>(relation).relatedClass);
            }
        }

        const constructors = [...localClasses.values()].map(
            (localClass) => [localClass, getRemoteClass(localClass)] as [typeof SolidModel, typeof SolidModel],
        );

        return tap(localModel.clone({ constructors }), (model) => {
            this.cleanRemoteModel(model);
        });
    }

    protected cloneRemoteModel(remoteModel: SolidModel): SolidModel {
        const remoteClasses = new Set<typeof SolidModel>();

        remoteClasses.add(remoteModel.static());

        if (remoteModel instanceof SolidContainer) {
            for (const relation of this.getContainerRelations(remoteModel.static())) {
                remoteClasses.add(remoteModel.requireRelation<SolidContainsRelation>(relation).relatedClass);
            }
        }

        const constructors = [...remoteClasses.values()].map(
            (remoteClass) => [remoteClass, getLocalClass(remoteClass)] as [typeof SolidModel, typeof SolidModel],
        );

        return remoteModel.clone({ constructors });
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

    protected async synchronizeContainerDocuments(
        localRelation: SolidContainsRelation,
        remoteRelation: SolidContainsRelation,
    ): Promise<void> {
        const localModels = map(localRelation.related ?? [], 'url');
        const remoteModels = map(remoteRelation.related ?? [], 'url');
        const newLocalModelUrls = localModels.getKeys().filter((url) => !remoteModels.hasKey(url));
        const newRemoteModelUrls = remoteModels.getKeys().filter((url) => !localModels.hasKey(url));

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

    protected login(authenticator: Authenticator): void {
        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;

        getRemoteClass(Tombstone).setEngine(this.engine);

        for (const handler of this.handlers.values()) {
            this.getRelatedClasses(handler).forEach((modelClass) =>
                getRemoteClass(modelClass).setEngine(authenticator.engine));
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

    protected async pushChanges(localModel?: SolidModel): Promise<void> {
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

    protected async fetchRemoteModels(localModels: SolidModel[]): Promise<SolidModel[]> {
        const typeIndex = await this.getTypeIndex();

        if (!typeIndex) {
            return [];
        }

        const registeredModels = [...this.handlers.keys()].map((modelClass) => {
            const registeredChildren = arrayFrom(this.handlers.get(modelClass)?.registerFor ?? []);

            return registeredChildren.length > 0
                ? { modelClass, forClass: registeredChildren.map((childrenClass) => childrenClass.rdfsClasses).flat() }
                : { modelClass, forClass: modelClass.rdfsClasses };
        });

        const remoteModels = await Promise.all(
            typeIndex.registrations.map(async (registration) => {
                const registeredModel = registeredModels.find(
                    ({ forClass }) => arrayEquals(forClass, registration.forClass) && !!registration.instanceContainer,
                );

                if (!registeredModel) {
                    return;
                }

                const remoteClass = getRemoteClass(registeredModel.modelClass);

                if (remoteClass.rdfsClasses.includes(expandIRI('ldp:Container'))) {
                    const container = await remoteClass.find(registration.instanceContainer);

                    container && (await this.loadChildren(container));

                    return container;
                }

                return remoteClass.from(registration.instanceContainer).all();
            }),
        );

        return this.completeRemoteModels(localModels, arrayFilter(remoteModels).flat());
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

    protected async updateTypeRegistrations(remoteModel: SolidModel): Promise<void> {
        const registeredChildren = arrayFrom(this.handlers.get(getLocalClass(remoteModel.static()))?.registerFor ?? []);

        if (!(remoteModel instanceof SolidContainer) || registeredChildren.length === 0) {
            return;
        }

        this.typeIndex ??= await Solid.findOrCreatePrivateTypeIndex();

        if (this.typeIndex.registrations.some((registration) => registration.instanceContainer === remoteModel.url)) {
            return;
        }

        await remoteModel.register(this.typeIndex, registeredChildren);
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

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:ready': void;
        'cloud:migrated': void;
        'cloud:sync-started': void;
        'cloud:sync-completed': void;
    }
}
