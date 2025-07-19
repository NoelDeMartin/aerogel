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
import { PropertyOperation, SolidContainer, Tombstone, isContainerClass } from 'soukai-solid';
import type {
    Operation,
    SolidContainsRelation,
    SolidModel,
    SolidModelConstructor,
    SolidSchemaDefinition,
} from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { Attributes } from 'soukai';

import SyncQueue from '@aerogel/plugin-local-first/lib/SyncQueue';
import { getContainerRelations, getRelatedAppModels } from '@aerogel/plugin-local-first/lib/inference';

interface CloneOptions {
    clean?: boolean;
}

const Cloud = required(() => App.service('$cloud'));
const remoteClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
const localClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
const cloneConstructors: WeakMap<SolidModelConstructor, [typeof SolidModel, typeof SolidModel][]> = new WeakMap();

function getRelationClasses(modelClass: typeof SolidModel, visited?: Set<typeof SolidModel>): Set<typeof SolidModel> {
    visited ??= new Set();

    if (!visited.has(modelClass)) {
        visited.add(modelClass);

        for (const relation of modelClass.relations) {
            getRelationClasses(modelClass.instance().requireRelation(relation).relatedClass, visited);
        }
    }

    return visited;
}

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

export function createRemoteContainer(remoteModel: SolidModel, localModels: ObjectsMap<SolidModel>): SolidContainer {
    const RemoteContainer = getRemoteClass(SolidContainer);
    const path = Cloud.registeredModels.find(
        ({ modelClass: registeredModelClass }) => registeredModelClass === remoteModel.static(),
    )?.path;

    return new RemoteContainer({
        url: getRemoteContainersCollection(getLocalModel(remoteModel, localModels).static(), path),
    });
}

export async function trackModelsCollection(modelClass: SolidModelConstructor, collection: string): Promise<void> {
    if (Cloud.modelCollections[modelClass.modelName]?.includes(collection)) {
        return;
    }

    Cloud.setState('modelCollections', {
        ...Cloud.modelCollections,
        [modelClass.modelName]: (Cloud.modelCollections[modelClass.modelName] ?? []).concat(collection),
    });

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

    await Cloud.getDocumentsCache().forget(
        requireUrlParentDirectory(localModel.requireDocumentUrl()),
        localModel.requireDocumentUrl(),
    );

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
    const constructors = Array.from(new Set(getRelatedAppModels(localModel).map((model) => model.static()))).map(
        (localClass) => [localClass, getRemoteClass(localClass)] as [typeof SolidModel, typeof SolidModel],
    );

    return tap(localModel.clone({ constructors }), (model) => {
        fixRemoteModelClone(model);

        options.clean && cleanRemoteModelClone(model);
    });
}

export function cloneRemoteModel(remoteModel: SolidModel): SolidModel {
    return remoteModel.clone({ constructors: getCloneConstructors(remoteModel) });
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

export function getCloneConstructors(model: SolidModel): [typeof SolidModel, typeof SolidModel][] {
    const modelClass = model.static();

    if (!cloneConstructors.has(modelClass)) {
        const constructors = Array.from(getRelationClasses(modelClass))
            .map((otherClass) =>
                isRemoteModelClass(otherClass)
                    ? [otherClass, getLocalClass(otherClass)]
                    : [otherClass, getRemoteClass(otherClass)])
            .map(([a, b]) => [
                [a, b] as [typeof SolidModel, typeof SolidModel],
                [b, a] as [typeof SolidModel, typeof SolidModel],
            ])
            .flat();

        for (const constructor of constructors) {
            cloneConstructors.set(constructor[0], constructors);
        }
    }

    return required(cloneConstructors.get(modelClass));
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
    return isRemoteModelClass(model.static());
}

export function isRemoteModelClass(modelClass: typeof SolidModel): boolean {
    return localClasses.has(modelClass);
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
                relation.relatedClass = getRemoteClass(relation.relatedClass);
            }
        }

        public override fixMalformedAttributes(): void {
            withLocalHistoryConfig(this.static(), () => super.fixMalformedAttributes());
        }
    
    } as unknown as T;

    LocalClass.on('schema-updated', async (schema) => {
        await RemoteClass.updateSchema({
            ...schema,
            timestamps: false,
            history: false,
        });
    });

    localClass.ensureBooted();
    bootModels({ [`Remote${localClass.modelName}`]: RemoteClass });
    App.service('$cloud') && Cloud.getEngine() && RemoteClass.setEngine(Cloud.requireEngine());

    remoteClasses.set(LocalClass, RemoteClass);
    localClasses.set(RemoteClass, LocalClass);

    return RemoteClass;
}

export function getLocalClass<T extends SolidModelConstructor>(remoteClass: T): T {
    return (localClasses.get(remoteClass) as T) ?? fail(`Couldn't find local class for ${remoteClass.modelName}`);
}
