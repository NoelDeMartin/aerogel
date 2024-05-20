import { bootModels } from 'soukai';
import { fail, isInstanceOf, map, objectWithout, tap } from '@noeldemartin/utils';
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
} from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { Attributes } from 'soukai';
import type { SolidModelConstructor } from 'soukai-solid';

import type { CloudService } from '@/services/Cloud';

export default class CloudMirroring {

    private remoteClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();
    private localClasses: WeakMap<SolidModelConstructor, SolidModelConstructor> = new WeakMap();

    protected createRemoteModel(this: CloudService, localModel: SolidModel): void {
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

    protected async updateRemoteModel(this: CloudService, localModel: SolidModel): Promise<void> {
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
        return [...this.registeredModels].map((modelClass) => getTrackedModels(modelClass)).flat();
    }

    protected getRemoteClass<T extends SolidModelConstructor>(localClass: T): T {
        return (this.remoteClasses.get(localClass) as T) ?? this.makeRemoteClass(localClass);
    }

    protected getRemoteContainersCollection(): string {
        return Solid.requireUser().storageUrls[0];
    }

    protected getRemoteModel(
        this: CloudService,
        localModel: SolidModel,
        remoteModels: ObjectsMap<SolidModel>,
    ): SolidModel {
        return remoteModels.get(localModel.url) ?? this.cloneLocalModel(localModel);
    }

    protected isRegisteredModel(this: CloudService, model: SolidModel): boolean {
        for (const modelClass of this.registeredModels) {
            const models = getTrackedModels(modelClass);

            if (models.some((registeredModel) => registeredModel.url === model.url)) {
                return true;
            }
        }

        return false;
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

}
