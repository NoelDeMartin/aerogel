import { bootModels } from 'soukai';
import {
    fail,
    objectWithout,
    requireUrlParentDirectory,
    required,
    tap,
    urlResolveDirectory,
    urlRoute,
} from '@noeldemartin/utils';
import { App } from '@aerogel/core';
import { getTrackedModels, trackModelsCollection as trackSoukaiModelsCollection } from '@aerogel/plugin-soukai';
import { Solid } from '@aerogel/plugin-solid';
import { PropertyOperation, SolidContainer, SolidContainsRelation, Tombstone, isContainerClass } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { Attributes } from 'soukai';
import type { Operation, SolidModel, SolidModelConstructor, SolidSchemaDefinition } from 'soukai-solid';

import DocumentsCache from '@aerogel/plugin-local-first/services/DocumentsCache';
import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import { getContainerRelations, getRelatedAppModels } from '@aerogel/plugin-local-first/lib/inference';

interface CloneOptions {
    clean?: boolean;
}

const Cloud = required(() => App.service('$cloud'));
const remoteClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
const localClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();

function cleanRemoteModelClone(remoteModel: SolidModel): void {
    const relatedModels = remoteModel.getRelatedModels().concat([remoteModel]);

    for (const relatedModel of relatedModels) {
        relatedModel.cleanDirty(true);
    }
}

function fixRemoteModelClone(remoteModel: SolidModel): void {
    const relatedModels = getRelatedAppModels(remoteModel).concat([remoteModel]);

    for (const relatedModel of relatedModels) {
        if (!relatedModel.operations || relatedModel.operations.length === 0) {
            continue;
        }

        const operations = (relatedModel.operations ?? []).filter((operation) => {
            return (
                !(operation instanceof PropertyOperation) ||
                !relatedModel.ignoreRdfPropertyHistory(operation.property, true)
            );
        });

        if (!operations.some((operation) => !operation.isInception(relatedModel))) {
            relatedModel.setRelationModels('operations', []);

            continue;
        }

        relatedModel.setRelationModels('operations', operations);
    }
}

export async function createRemoteModel(localModel: SolidModel): Promise<void> {
    Cloud.setState({
        localModelUpdates: {
            ...Cloud.localModelUpdates,
            [localModel.url]: 1,
        },
    });

    if (isRegisteredModelClass(localModel.static())) {
        await trackModelsCollection(localModel.static(), requireUrlParentDirectory(localModel.url));
    }

    if (Cloud.autoPush && Cloud.ready && !Cloud.syncing) {
        SyncQueue.push(localModel);
    }
}

export async function trackModelsCollection(modelClass: SolidModelConstructor, collection: string): Promise<void> {
    if (Cloud.modelCollections[modelClass.modelName]?.includes(collection)) {
        return;
    }

    Cloud.setState('modelCollections', {
        ...Cloud.modelCollections,
        [modelClass.modelName]: (Cloud.modelCollections[modelClass.modelName] ?? []).concat(collection),
    });

    if (!Cloud.modelCollections[modelClass.modelName]?.includes(modelClass.collection)) {
        modelClass.collection = collection;
    }

    await trackSoukaiModelsCollection(modelClass, collection);
}

export async function updateRemoteModel(localModel: SolidModel): Promise<void> {
    if (ignoreModelUpdates(localModel)) {
        return;
    }

    const modelUpdates = Cloud.localModelUpdates[localModel.url] ?? 0;

    Cloud.setState({
        localModelUpdates: localModel.isSoftDeleted()
            ? objectWithout(Cloud.localModelUpdates, localModel.url)
            : {
                ...Cloud.localModelUpdates,
                [localModel.url]: modelUpdates + 1,
            },
    });

    await DocumentsCache.forget(localModel.requireDocumentUrl());

    if (Cloud.autoPush && Cloud.ready && !Cloud.syncing) {
        SyncQueue.push(localModel);
    }
}

export function clearLocalModelUpdates(syncedModelUrls: Set<string>, documentsWithErrors?: Set<string>): void {
    const localModelUpdates = {} as Record<string, number>;
    const syncedModelUrlsArray = Array.from(syncedModelUrls);

    for (const [url, count] of Object.entries(Cloud.localModelUpdates)) {
        const documentUrl = urlRoute(url);
        const wasSynced =
            syncedModelUrls.has(url) ||
            syncedModelUrlsArray.some((modelUrl) => modelUrl.endsWith('/') && url.startsWith(modelUrl));

        if (wasSynced && !documentsWithErrors?.has(documentUrl)) {
            continue;
        }

        localModelUpdates[url] = count;
    }

    Cloud.setState({ localModelUpdates });
}

export function cloneLocalModel(localModel: SolidModel, options: CloneOptions = {}): SolidModel {
    const localModelClasses = new Set<typeof SolidModel>();

    localModelClasses.add(localModel.static());

    if (localModel instanceof SolidContainer) {
        for (const relation of getContainerRelations(localModel.static())) {
            localModelClasses.add(localModel.requireRelation<SolidContainsRelation>(relation).relatedClass);
        }
    }

    const constructors = [...localModelClasses.values()].map(
        (localClass) => [localClass, getRemoteClass(localClass)] as [typeof SolidModel, typeof SolidModel],
    );

    return tap(localModel.clone({ constructors }), (model) => {
        fixRemoteModelClone(model);

        options.clean && cleanRemoteModelClone(model);
    });
}

export function cloneRemoteModel(remoteModel: SolidModel): SolidModel {
    const remoteModelClasses = new Set<typeof SolidModel>();

    remoteModelClasses.add(remoteModel.static());

    if (remoteModel instanceof SolidContainer) {
        for (const relation of getContainerRelations(remoteModel.static())) {
            remoteModelClasses.add(remoteModel.requireRelation<SolidContainsRelation>(relation).relatedClass);
        }
    }

    const constructors = [...remoteModelClasses.values()].map(
        (remoteClass) => [remoteClass, getLocalClass(remoteClass)] as [typeof SolidModel, typeof SolidModel],
    );

    return remoteModel.clone({ constructors });
}

export async function completeRemoteModels(
    localModels: SolidModel[],
    remoteModels: SolidModel[],
    documentsWithErrors: Set<string>,
): Promise<SolidModel[]> {
    const RemoteTombstone = getRemoteClass(Tombstone);
    const remoteModelUrls = remoteModels.map((remoteModel) => remoteModel.url);
    const missingModelDocumentUrls = localModels
        .filter((localModel) => !remoteModelUrls.includes(localModel.url))
        .map((localModel) => localModel.requireDocumentUrl())
        .filter((documentUrl) => !documentsWithErrors.has(documentUrl));
    const tombstones = await RemoteTombstone.all({ $in: missingModelDocumentUrls });

    return remoteModels.concat(tombstones);
}

export function ignoreModelUpdates(localModel: SolidModel): boolean {
    const documentModels = localModel.getDocumentModels();
    const documentOperations = documentModels.flatMap(
        (model) => model.operations?.map((operation) => [model, operation] as [SolidModel, Operation]) ?? [],
    );

    return !documentOperations.some(([model, operation]) => {
        if (operation.date.getTime() !== model.metadata?.updatedAt?.getTime()) {
            return false;
        }

        if (!(operation instanceof PropertyOperation)) {
            return true;
        }

        return !model.ignoreRdfPropertyHistory(operation.property, true);
    });
}

export function getLocalModel(remoteModel: SolidModel, localModels: ObjectsMap<SolidModel>): SolidModel {
    return localModels.get(remoteModel.url) ?? cloneRemoteModel(remoteModel);
}

export function getLocalModels(): SolidModel[] {
    return [...Cloud.registeredModels]
        .map(({ modelClass }) => getTrackedModels(modelClass, { includeSoftDeleted: true }))
        .flat();
}

export function getSchemaMigrations(): Map<SolidModelConstructor, SolidModelConstructor | SolidSchemaDefinition> {
    return Cloud.schemaMigrations;
}

export function clearSchemaMigrations(): void {
    Cloud.schemaMigrations.clear();
}

export function getSchemaMigration(
    modelClass: SolidModelConstructor,
): SolidModelConstructor | SolidSchemaDefinition | undefined {
    return Cloud.schemaMigrations.get(modelClass);
}

export function getRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
    return (remoteClasses.get(localClass) as T) ?? makeRemoteClass(localClass);
}

export function getRemoteContainersCollection(modelClass: SolidModelConstructor, path?: string): string {
    const rootStorage = Solid.requireUser().storageUrls[0];
    const containedClass =
        isContainerClass(modelClass) &&
        getContainerRelations(modelClass)
            .map((relation) => {
                const relatedClass = modelClass
                    .instance()
                    .requireRelation<SolidContainsRelation>(relation).relatedClass;

                if (isContainerClass(relatedClass)) {
                    return null;
                }

                return relatedClass;
            })
            .filter(Boolean)[0];

    path ??= `/${(containedClass || modelClass).modelName.toLowerCase()}s/`;

    return urlResolveDirectory((path.startsWith('/') ? rootStorage.slice(0, -1) : rootStorage) + path);
}

export function getRemoteModel(localModel: SolidModel, remoteModels: ObjectsMap<SolidModel>): SolidModel {
    return remoteModels.get(localModel.url) ?? cloneLocalModel(localModel);
}

export function isRegisteredModel(model: SolidModel): boolean {
    for (const { modelClass } of Cloud.registeredModels) {
        const models = getTrackedModels(modelClass);

        if (models.some((registeredModel) => registeredModel.url === model.url)) {
            return true;
        }
    }

    return false;
}

export function isRemoteModel(model: SolidModel): boolean {
    return localClasses.has(model.static());
}

export function isLocalModel(model: SolidModel): boolean {
    return !isRemoteModel(model);
}

export function isRegisteredModelClass(modelClass: SolidModelConstructor): boolean {
    return Cloud.registeredModels.some(({ modelClass: registeredModelClass }) => registeredModelClass === modelClass);
}

export function makeRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
    const LocalClass = localClass as typeof SolidModel;
    const withLocalHistoryConfig = (modelClass: typeof SolidModel, operation: () => unknown) => {
        modelClass.timestamps = LocalClass.timestamps;
        modelClass.history = LocalClass.history;

        operation();

        modelClass.timestamps = [];
        modelClass.history = false;
    };
    const RemoteClass = class extends LocalClass {

        public static override timestamps = false;
        public static override history = false;

        protected override initialize(attributes: Attributes, exists: boolean): void {
            withLocalHistoryConfig(this._proxy.static(), () => super.initialize(attributes, exists));
        }

        protected override initializeRelations(): void {
            super.initializeRelations();

            for (const relation of Object.values(this._relations)) {
                if (!(relation instanceof SolidContainsRelation)) {
                    continue;
                }

                relation.relatedClass = getRemoteClass(relation.relatedClass);
            }
        }

        public override fixMalformedAttributes(): void {
            withLocalHistoryConfig(this.static(), () => super.fixMalformedAttributes());
        }
    
    } as unknown as T;

    remoteClasses.set(LocalClass, RemoteClass);
    localClasses.set(RemoteClass, LocalClass);

    LocalClass.on('schema-updated', async (schema) => {
        await RemoteClass.updateSchema({
            ...schema,
            timestamps: false,
            history: false,
        });
    });

    bootModels({ [`Remote${localClass.modelName}`]: RemoteClass });

    return RemoteClass;
}

export function getLocalClass<T extends SolidModelConstructor>(remoteClass: T): T {
    return (localClasses.get(remoteClass) as T) ?? fail(`Couldn't find local class for ${remoteClass.modelName}`);
}
