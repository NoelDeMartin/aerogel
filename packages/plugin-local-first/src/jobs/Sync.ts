import {
    arrayWithout,
    isInstanceOf,
    map,
    mixed,
    requireUrlParentDirectory,
    required,
    round,
    toString,
    urlRoute,
} from '@noeldemartin/utils';
import { App, Errors, Job } from '@aerogel/core';
import { InvalidModelAttributes, requireBootedModel } from 'soukai';
import { MalformedSolidDocumentError } from '@noeldemartin/solid-utils';
import { Solid } from '@aerogel/plugin-solid';
import { SolidContainer, SolidModel, Tombstone, isContainer, isContainerClass } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { JobListener, JobStatus } from '@aerogel/core';
import type { SolidContainsRelation, SolidEngine, SolidModelConstructor, SolidTypeIndex } from 'soukai-solid';

import {
    clearLocalModelUpdates,
    cloneLocalModel,
    cloneRemoteModel,
    completeRemoteModels,
    createRemoteContainer,
    getCloneConstructors,
    getLocalModel,
    getLocalModels,
    getRemoteClass,
    getRemoteModel,
    isRegisteredModel,
    isRemoteModel,
    trackModelsCollection,
} from '@aerogel/plugin-local-first/lib/mirroring';
import {
    getContainerRegisteredClasses,
    getContainerRelations,
    getRelatedAppModels,
    isDirtyOrHasDirtyChildren,
    loadAppRelations,
} from '@aerogel/plugin-local-first/lib/inference';

import LoadsChildren from './mixins/LoadsChildren';
import LoadsTypeIndex from './mixins/LoadsTypeIndex';
import TracksLocalModels from './mixins/TracksLocalModels';
import type { ResourceJobStatus } from './mixins/LoadsChildren';

const Cloud = required(() => App.service('$cloud'));
const BaseJob = Job as typeof Job<JobListener, SyncJobStatus, SyncJobStatus>;

interface SyncJobStatus extends JobStatus {
    root: true;
    children: [SyncPullJobStatus, JobStatus];
}

interface SyncPullJobStatus extends JobStatus {
    children?: ResourceJobStatus[];
}

function isRootStatus(status?: JobStatus): status is SyncJobStatus {
    return !!status && 'root' in status;
}

export default class Sync extends mixed(BaseJob, [LoadsChildren, LoadsTypeIndex, TracksLocalModels]) {

    public readonly documentsWithErrors: Set<string>;
    protected models?: SolidModel[];
    protected dirtyRemoteModels?: SolidModel[];
    protected rootLocalModels: SolidModel[];
    protected tombstones: ObjectsMap<Tombstone>;
    protected syncedModelUrls: Set<string>;
    protected documentsModifiedAt: Record<string, Date>;
    protected screenLock: Promise<void | { release(): Promise<void> }> | null = null;
    protected override localModels: ObjectsMap<SolidModel>;

    constructor(models?: SolidModel[]) {
        super();

        this.documentsWithErrors = new Set();
        this.models = models;
        this.rootLocalModels = [];
        this.localModels = map([], 'url');
        this.tombstones = map([], 'resourceUrl');
        this.syncedModelUrls = new Set();
        this.documentsModifiedAt = {};
    }

    protected async run(): Promise<void> {
        const engine = Solid.requireAuthenticator().engine as SolidEngine;
        const updateDocumentDate = (url: string, { headers }: { headers?: Headers }, fallbackDate?: Date) => {
            const date = headers?.get('last-modified') ?? fallbackDate;

            if (!date || url.endsWith('/')) {
                return;
            }

            this.documentsModifiedAt[url] = new Date(date);
        };
        const clearListener = engine.listeners.add({
            onDocumentRead: (url, metadata) => updateDocumentDate(url, metadata),
            onDocumentUpdated: (url, metadata) => updateDocumentDate(url, metadata, new Date()),
        });

        try {
            this.lockScreen();
            this.rootLocalModels = this.models ?? getLocalModels();

            engine.setConfig({ cachesDocuments: true, persistentCache: Cloud.getDocumentsCache() });

            await this.indexLocalModels(this.rootLocalModels);
            await this.pullChanges();
            await this.pushChanges();

            engine.clearCache();
            engine.setConfig({ cachesDocuments: false, persistentCache: undefined });
        } finally {
            this.releaseScreen();
            clearListener();
        }
    }

    protected lockScreen(): void {
        const typedNavigator = navigator as {
            wakeLock?: { request(type?: 'screen'): Promise<{ release(): Promise<void> }> };
        };

        if (!typedNavigator.wakeLock) {
            return;
        }

        try {
            this.screenLock = typedNavigator.wakeLock.request('screen').catch((error) => {
                Errors.reportDevelopmentError(error, 'Could not request screen wake lock');
            });
        } catch (error) {
            Errors.reportDevelopmentError(error, 'Could not request screen wake lock');
        }
    }

    protected releaseScreen(): void {
        if (!this.screenLock) {
            return;
        }

        this.screenLock.then((lock) => lock?.release());
        this.screenLock = null;
    }

    protected override getInitialStatus(): SyncJobStatus {
        return {
            root: true,
            completed: false,
            children: [{ completed: false }, { completed: false }],
        };
    }

    protected override calculateCurrentProgress(status?: JobStatus): number {
        status ??= this.status;

        if (isRootStatus(status)) {
            return round(
                this.calculateCurrentProgress(status.children[0]) * 0.9 +
                    this.calculateCurrentProgress(status.children[1]) * 0.1,
                2,
            );
        }

        return super.calculateCurrentProgress(status);
    }

    private async pullChanges(): Promise<void> {
        const remoteModelsArray = this.models
            ? await this.fetchRemoteModelsForLocal(this.models)
            : await this.fetchRemoteModels();
        const remoteModels = map(remoteModelsArray, (model) => {
            if (model instanceof Tombstone) {
                return model.resourceUrl;
            }

            return model.url;
        });

        this.dirtyRemoteModels = await this.synchronizeModels(remoteModels);

        await this.updateProgress((status) => (status.children[0].completed = true));
    }

    private async pushChanges(): Promise<void> {
        const localDocuments = new Set(this.localModels.getItems().map((model) => model.getDocumentUrl()));
        const remoteModels = this.dirtyRemoteModels ?? [];
        const childrenStatus = (this.status.children[1].children = remoteModels.map(() => ({ completed: false })));

        for (let index = 0; index < remoteModels.length; index++) {
            const remoteModel = remoteModels[index] as SolidModel;
            const childStatus = childrenStatus[index] as JobStatus;

            if (remoteModel.isSoftDeleted()) {
                remoteModel.enableHistory();
                remoteModel.enableTombstone();

                await remoteModel.forceDelete();
                await this.updateProgress(() => (childStatus.completed = true));

                return;
            }

            await this.saveModelAndRelated(remoteModel, childStatus);
            await this.updateTypeRegistrations(remoteModel);
            await this.updateProgress(() => (childStatus.completed = true));
        }

        const documentsCache = Cloud.getDocumentsCache();
        const tombstoneDocuments = map(this.tombstones.getItems(), (tombstone) => tombstone.requireDocumentUrl());

        for (const [documentUrl, modifiedAt] of Object.entries(this.documentsModifiedAt)) {
            if (localDocuments.has(documentUrl)) {
                await documentsCache.remember(requireUrlParentDirectory(documentUrl), documentUrl, modifiedAt);

                continue;
            }

            if (tombstoneDocuments.hasKey(documentUrl)) {
                const tombstone = tombstoneDocuments.require(documentUrl);

                await documentsCache.remember(requireUrlParentDirectory(documentUrl), documentUrl, modifiedAt, {
                    tombstone: {
                        url: tombstone.url,
                        resourceUrl: tombstone.resourceUrl,
                    },
                });

                continue;
            }
        }

        clearLocalModelUpdates(this.syncedModelUrls, this.documentsWithErrors);

        await this.updateProgress((status) => (status.children[1].completed = true));
    }

    private async fetchRemoteModels(): Promise<SolidModel[]> {
        const pullStatus = this.status.children[0];
        const typeIndex = await this.loadTypeIndex({ fresh: true });

        if (!typeIndex) {
            return [];
        }

        const remoteModels: SolidModel[] = [];
        const registrations = this.getTypeRegistrations(typeIndex);

        pullStatus.children = registrations.map(() => ({ completed: false }));

        for (let index = 0; index < registrations.length; index++) {
            const status = required(pullStatus.children?.[index]);
            const { registration, registeredModel } = required(registrations[index]);
            const remoteClass = getRemoteClass(registeredModel.modelClass);

            if (!registration.instanceContainer) {
                continue;
            }

            Cloud.rootModelCollections[registeredModel.modelClass.modelName] ??= registration.instanceContainer;

            if (isContainerClass(remoteClass)) {
                await trackModelsCollection(
                    registeredModel.modelClass,
                    requireUrlParentDirectory(registration.instanceContainer),
                );

                const container = await remoteClass.find(registration.instanceContainer);

                if (container) {
                    await this.loadChildren(container, status);

                    remoteModels.push(container);
                }

                await this.updateProgress(() => (status.completed = true));

                continue;
            }

            const containerModels = await this.fetchRemoteModelsFromContainer(
                status,
                registeredModel.modelClass,
                remoteClass,
                registration.instanceContainer,
            );

            remoteModels.push(...containerModels);

            await this.updateProgress(() => (status.completed = true));
        }

        for (const remoteModel of remoteModels) {
            await loadAppRelations(remoteModel, (error) => this.handleDocumentError(error));
        }

        return completeRemoteModels(this.rootLocalModels, remoteModels, this.documentsWithErrors);
    }

    private async fetchRemoteModelsFromContainer(
        status: ResourceJobStatus,
        localClass: SolidModelConstructor,
        remoteClass: SolidModelConstructor,
        containerUrl: string,
    ): Promise<SolidModel[]> {
        const container = await getRemoteClass(SolidContainer).find(containerUrl);

        if (!container) {
            return [];
        }

        status.children = container.resourceUrls.map(() => ({ completed: false }));

        const documents = await this.loadContainedDocuments(container, {
            status,
            onDocumentError: (error) => this.handleDocumentError(error),
            onDocumentRead: (document) => {
                if (document.url.endsWith('/') || !document.updatedAt || document.url in this.documentsModifiedAt) {
                    return;
                }

                this.documentsModifiedAt[document.url] = document.updatedAt;
            },
            onDocumentLoaded: async () => {
                this.assertNotCancelled();

                await this.updateProgress();
            },
        });

        const remoteModels = await remoteClass.createManyFromEngineDocuments(documents);
        const tombstones = await Tombstone.createManyFromEngineDocuments(documents);

        for (const tombstone of tombstones) {
            this.tombstones.add(tombstone);
        }

        if (remoteModels.length > 0) {
            await trackModelsCollection(localClass, containerUrl);
        }

        for (let index = 0; index < container.resourceUrls.length; index++) {
            const resourceUrl = container.resourceUrls[index];

            if (!resourceUrl?.endsWith('/')) {
                continue;
            }

            const childModels = await this.fetchRemoteModelsFromContainer(
                required(status.children?.[index]),
                localClass,
                remoteClass,
                resourceUrl,
            );

            remoteModels.push(...childModels);

            await this.updateProgress();
        }

        await this.updateProgress(() => (status.completed = true));

        return remoteModels;
    }

    private async fetchRemoteModelsForLocal(models: SolidModel[]): Promise<SolidModel[]> {
        const remoteModels = [] as SolidModel[];
        const statusChildren = (this.status.children[0].children = models.map(() => ({ completed: false })));

        for (let index = 0; index < models.length; index++) {
            await this.ignoringDocumentErrors(async () => {
                const localModel = models[index] as SolidModel;
                const childStatus = statusChildren[index] as JobStatus;
                const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);

                if (!remoteModel) {
                    await this.updateProgress(() => (childStatus.completed = true));

                    return;
                }

                isContainer(remoteModel) && (await this.loadChildren(remoteModel, childStatus));

                remoteModels.push(remoteModel);

                await this.updateProgress(() => (childStatus.completed = true));
            });
        }

        for (const remoteModel of remoteModels) {
            await loadAppRelations(remoteModel, (error) => this.handleDocumentError(error));
        }

        return completeRemoteModels(models, remoteModels, this.documentsWithErrors);
    }

    private getTypeRegistrations(typeIndex: SolidTypeIndex) {
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
        const registrations = typeIndex.registrations
            .map((registration) => {
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
                    return null;
                }

                processedContainerUrls.add(registration.instanceContainer);

                return { registration, registeredModel };
            })
            .filter((match) => !!match);

        // Removed nested registrations.
        const containerUrls = registrations.map(({ registration }) => registration.instanceContainer);

        return registrations.filter(({ registration }) => {
            return !containerUrls.some(
                (containerUrl) =>
                    containerUrl &&
                    containerUrl !== registration.instanceContainer &&
                    registration.instanceContainer?.startsWith(containerUrl),
            );
        });
    }

    private async updateTypeRegistrations(remoteModel: SolidModel): Promise<void> {
        if (!isRegisteredModel(remoteModel)) {
            return;
        }

        const container = isContainer(remoteModel) ? remoteModel : createRemoteContainer(remoteModel, this.localModels);
        const registeredChildren = isContainer(remoteModel)
            ? getContainerRegisteredClasses(remoteModel.static())
            : [remoteModel.static()];

        if (registeredChildren.length === 0) {
            return;
        }

        const typeIndex = await this.loadTypeIndex({ create: true });

        if (
            typeIndex.registrations.some(
                (registration) =>
                    registration.instanceContainer && remoteModel.url.startsWith(registration.instanceContainer),
            )
        ) {
            return;
        }

        await container.register(typeIndex, registeredChildren);
    }

    private async loadChildren(model: SolidModel, childStatus?: JobStatus): Promise<void> {
        this.assertNotCancelled();

        if (!isContainer(model)) {
            return;
        }

        const children = await this.loadContainedModels(model, {
            status: childStatus,
            onDocumentError: (error) => this.handleDocumentError(error),
            onDocumentRead: (document) => {
                if (document.url.endsWith('/') || !document.updatedAt || document.url in this.documentsModifiedAt) {
                    return;
                }

                this.documentsModifiedAt[document.url] = document.updatedAt;
            },
            onDocumentLoaded: async () => {
                this.assertNotCancelled();

                await this.updateProgress();
            },
        });

        for (let index = 0; index < children.length; index++) {
            const child = children[index] as SolidModel;

            if (child instanceof Tombstone) {
                this.tombstones.add(child);

                continue;
            }

            if (this.tombstones.hasKey(child.url)) {
                await this.deleteChild(model, child);

                continue;
            }

            await this.loadChildren(child, childStatus?.children?.[index]);

            if (childStatus?.children?.[index]) {
                await this.updateProgress(() => (required(childStatus.children?.[index]).completed = true));
            }
        }
    }

    private async deleteChild(model: SolidModel, child: SolidModel): Promise<void> {
        for (const relation of model.static('relations')) {
            const relationInstance = model.requireRelation(relation);

            if (!relationInstance.related) {
                continue;
            }

            if (Array.isArray(relationInstance.related)) {
                relationInstance.related = relationInstance.related.filter((relatedModel) => relatedModel !== child);

                continue;
            }

            if (relationInstance.related === child) {
                relationInstance.related = null;

                continue;
            }
        }

        await child.forceDelete();
    }

    private async saveModelAndRelated(
        model: SolidModel,
        status?: JobStatus,
        processedModels?: Set<SolidModel>,
    ): Promise<void> {
        this.assertNotCancelled();
        processedModels ??= new Set();

        if (processedModels.has(model)) {
            return;
        }

        processedModels.add(model);

        if (isRemoteModel(model) && model.isSoftDeleted()) {
            model.enableHistory();
            model.enableTombstone();

            await model.forceDelete();

            return;
        }

        if (model.getDocumentUrl() && this.documentsWithErrors.has(model.requireDocumentUrl())) {
            return;
        }

        const wasDirty = model.isDirty();

        await model.save();

        if (wasDirty || isRemoteModel(model)) {
            this.syncedModelUrls.add(model.url);
        }

        if (isRemoteModel(model)) {
            const documentUrl = model.requireDocumentUrl();
            const modifiedAt = this.documentsModifiedAt[documentUrl];

            if (modifiedAt) {
                await Cloud.getDocumentsCache().remember(
                    requireUrlParentDirectory(documentUrl),
                    documentUrl,
                    modifiedAt,
                );

                delete this.documentsModifiedAt[documentUrl];
            }
        }

        const children = arrayWithout(getRelatedAppModels(model), model);
        const childrenStatuses = status ? children.map(() => ({ completed: false })) : [];

        if (status) {
            status.children = childrenStatuses;
        }

        for (let index = 0; index < children.length; index++) {
            const child = children[index] as SolidModel;
            const childStatus = childrenStatuses[index];

            await this.saveModelAndRelated(child, childStatus, processedModels);

            if (childStatus) {
                await this.updateProgress(() => (childStatus.completed = true));
            }
        }
    }

    private async synchronizeModels(remoteModels: ObjectsMap<SolidModel>): Promise<SolidModel[]> {
        const synchronizedModelUrls = new Set<string>();
        const deletedModels = new Set<SolidModel>();

        for (const remoteModel of remoteModels.items()) {
            if (remoteModel instanceof Tombstone) {
                const localModel = this.localModels.get(remoteModel.resourceUrl);

                if (localModel) {
                    await localModel.forceDelete();

                    deletedModels.add(localModel);
                }

                continue;
            }

            const localModel = getLocalModel(remoteModel, this.localModels);

            if (!localModel.exists()) {
                this.syncedModelUrls.add(localModel.url);
            }

            await this.loadChildren(localModel);
            await SolidModel.synchronize(localModel, remoteModel, {
                constructors: getCloneConstructors(localModel),
            });
            await this.reconcileInconsistencies(localModel, remoteModel);
            await this.saveModelAndRelated(localModel);
            await this.addLocalModel(localModel);

            if (!this.rootLocalModels.includes(localModel)) {
                this.rootLocalModels.push(localModel);
            }

            synchronizedModelUrls.add(localModel.url);
        }

        for (const localModel of this.rootLocalModels) {
            if (deletedModels.has(localModel) || synchronizedModelUrls.has(localModel.url)) {
                continue;
            }

            await this.loadChildren(localModel);

            const remoteModel = getRemoteModel(localModel, remoteModels);

            await SolidModel.synchronize(localModel, remoteModel, {
                constructors: getCloneConstructors(localModel),
            });

            remoteModels.add(remoteModel);
        }

        const dirtyRemoteModels = [];

        for (const remoteModel of remoteModels.getItems()) {
            if (isDirtyOrHasDirtyChildren(remoteModel)) {
                dirtyRemoteModels.push(remoteModel);

                continue;
            }

            await this.rememberModelDocuments(remoteModel);
        }

        return dirtyRemoteModels;
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

            await this.reconcileInconsistencies(
                localRelatedModel,
                remoteRelatedModels.require(localRelatedModel.url),
                processedModels,
            );
        }

        if (localModel.isDirty()) {
            await SolidModel.synchronize(localModel, remoteModel, {
                constructors: getCloneConstructors(localModel),
            });
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
            this.syncedModelUrls.add(localModel.url);
        }

        for (const localModel of localModels.items()) {
            const remoteModel = remoteModels.require(localModel.url);

            await SolidModel.synchronize(localModel, remoteModel, {
                constructors: getCloneConstructors(localModel),
            });
            await this.saveModelAndRelated(localModel);
        }
    }

    private async rememberModelDocuments(model: SolidModel): Promise<void> {
        this.syncedModelUrls.add(model.url);

        if (!isContainer(model)) {
            const documentUrl = model.requireDocumentUrl();
            const modifiedAt = this.documentsModifiedAt[documentUrl];

            if (modifiedAt) {
                await Cloud.getDocumentsCache().remember(
                    requireUrlParentDirectory(documentUrl),
                    documentUrl,
                    modifiedAt,
                );

                delete this.documentsModifiedAt[documentUrl];
            }

            return;
        }

        const children = getContainerRelations(model.static())
            .map((relation) => model.getRelationModels(relation) ?? [])
            .flat();

        for (const child of children) {
            await this.rememberModelDocuments(child);
        }
    }

    private async ignoringDocumentErrors(operation: Function): Promise<void> {
        try {
            await operation();
        } catch (error) {
            this.handleDocumentError(error);
        }
    }

    private handleDocumentError(error: unknown): void {
        if (isInstanceOf(error, MalformedSolidDocumentError)) {
            // eslint-disable-next-line no-console
            console.warn(error.message);

            error.documentUrl && this.documentsWithErrors.add(error.documentUrl);

            return;
        }

        if (isInstanceOf(error, InvalidModelAttributes)) {
            // eslint-disable-next-line no-console
            console.warn(error.message);

            const primaryKey = error.attributes[requireBootedModel(error.modelName).primaryKey];
            const documentUrl = primaryKey && urlRoute(toString(primaryKey));

            documentUrl && this.documentsWithErrors.add(documentUrl);

            return;
        }

        throw error;
    }

}
