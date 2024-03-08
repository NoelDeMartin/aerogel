import { bootModels } from 'soukai';
import { fail, isInstanceOf, tap } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import {
    Metadata,
    Operation,
    SolidACLAuthorization,
    SolidContainer,
    SolidContainsRelation,
    Tombstone,
} from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { Attributes } from 'soukai';
import type { SolidModel, SolidModelConstructor } from 'soukai-solid';

import { getContainerRelations } from '@/lib/inference';

const remoteClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
const localClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();

function makeRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
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

                relation.relatedClass = getRemoteClass(relation.relatedClass);
            }
        }

        public fixMalformedAttributes(): void {
            withLocalHistoryConfig(this.static(), () => super.fixMalformedAttributes());
        }
    
    } as unknown as T;

    remoteClasses.set(LocalClass, RemoteClass);
    localClasses.set(RemoteClass, LocalClass);

    bootModels({ [`Remote${localClass.modelName}`]: RemoteClass });

    return RemoteClass;
}

function cleanRemoteModel(remoteModel: SolidModel, modelsRemoteOperationUrls: Record<string, string[]>): void {
    const remoteOperationUrls = modelsRemoteOperationUrls[remoteModel.url];

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

function getLocalClass<T extends SolidModelConstructor>(remoteClass: T): T {
    return (localClasses.get(remoteClass) as T) ?? fail(`Couldn't find local class for ${remoteClass.modelName}`);
}

export function cloneLocalModel(localModel: SolidModel, remoteOperationUrls: Record<string, string[]>): SolidModel {
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
        cleanRemoteModel(model, remoteOperationUrls);
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
): Promise<SolidModel[]> {
    const RemoteTombstone = getRemoteClass(Tombstone);
    const remoteModelUrls = remoteModels.map((remoteModel) => remoteModel.url);
    const missingModelDocumentUrls = localModels
        .filter((localModel) => !remoteModelUrls.includes(localModel.url))
        .map((localModel) => localModel.requireDocumentUrl());
    const tombstones = await RemoteTombstone.all({ $in: missingModelDocumentUrls });

    return remoteModels.concat(tombstones);
}

export function getLocalModel(remoteModel: SolidModel, localModels: ObjectsMap<SolidModel>): SolidModel {
    return localModels.get(remoteModel.url) ?? cloneRemoteModel(remoteModel);
}

export function getRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
    return (remoteClasses.get(localClass) as T) ?? makeRemoteClass(localClass);
}

export function getRemoteContainersCollection(): string {
    return Solid.requireUser().storageUrls[0];
}

export function getRemoteModel(
    localModel: SolidModel,
    remoteModels: ObjectsMap<SolidModel>,
    remoteOperationUrls: Record<string, string[]>,
): SolidModel {
    return remoteModels.get(localModel.url) ?? cloneLocalModel(localModel, remoteOperationUrls);
}
