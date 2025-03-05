import { PropertyOperation, isContainer } from 'soukai-solid';
import { Job } from '@aerogel/core';
import { isInstanceOf, map, mixed, objectMap, tap } from '@noeldemartin/utils';
import type { JobListener, JobStatus } from '@aerogel/core';
import type { Nullable } from '@noeldemartin/utils';
import type { SolidModel, SolidTypeIndex } from 'soukai-solid';

import { clearSchemaMigrations, getRemoteClass, getSchemaMigration, getSchemaMigrations } from '@/lib/mirroring';
import { getContainerRegisteredClasses } from '@/lib/inference';

import LoadsChildren from './mixins/LoadsChildren';
import LoadsTypeIndex from './mixins/LoadsTypeIndex';
import TracksLocalModels from './mixins/TracksLocalModels';

const BaseJob = Job as typeof Job<JobListener, MigrateJobStatus, MigrateJobStatus>;

export interface MigrateJobStatus extends JobStatus {
    children?: MigrateModelJobStatus[];
}

export interface MigrateModelJobStatus extends JobStatus {
    modelUrl: string;
    children?: MigrateModelJobStatus[];
}

export default class Migrate extends mixed(BaseJob, [LoadsChildren, LoadsTypeIndex, TracksLocalModels]) {

    public static restore(status: MigrateJobStatus): Migrate {
        return tap(new Migrate(), (job) => {
            job.status = status;
        });
    }

    protected _models?: SolidModel[];

    public get models(): SolidModel[] | undefined {
        return this._models;
    }

    public set models(models: SolidModel[] | undefined) {
        if (!models) {
            delete this._models;
            delete this.localModels;

            return;
        }

        const childrenStatus = objectMap(this.status.children ?? [], 'modelUrl');

        this._models = models;
        this.localModels = map([], 'url');
        this.status.children = models.map(
            (model) =>
                childrenStatus[model.url] ?? {
                    modelUrl: model.url,
                    completed: false,
                },
        );
    }

    protected async run(): Promise<void> {
        if (!this.models) {
            throw new Error('Cant start migration without models');
        }

        await this.indexLocalModels(this.models);

        const modelStatuses = this.status.children ?? [];
        const typeIndex = await this.loadTypeIndex();

        for (const modelStatus of modelStatuses) {
            const model = this.models.find(({ url }) => modelStatus.modelUrl === url);

            if (!model || modelStatus.completed) {
                continue;
            }

            await this.migrateRegisteredModel(model, modelStatus, typeIndex);
            await this.updateProgress(() => (modelStatus.completed = true));
        }

        for (const [modelClass, schema] of getSchemaMigrations()) {
            await modelClass.updateSchema(schema);
        }

        clearSchemaMigrations();
    }

    protected async migrateRegisteredModel(
        model: SolidModel,
        status: MigrateModelJobStatus,
        typeIndex?: Nullable<SolidTypeIndex>,
    ): Promise<void> {
        await this.migrate(model, status);

        if (!isContainer(model)) {
            return;
        }

        const registeredClasses = getContainerRegisteredClasses(model.static());
        const registration = typeIndex?.registrations.find(({ instanceContainer }) => instanceContainer === model.url);

        if (!typeIndex || !registration || registeredClasses.length === 0) {
            return;
        }

        registration.setAttribute(
            'forClass',
            registeredClasses
                .map((modelClass) => getSchemaMigration(modelClass)?.rdfsClasses ?? modelClass.rdfsClass)
                .flat(),
        );

        await typeIndex.save();
    }

    protected async migrate(localModel: SolidModel, status: MigrateModelJobStatus): Promise<void> {
        this.assertNotCancelled();

        await this.migrateChildren(localModel, status);

        const schema = getSchemaMigration(localModel.static());

        if (!schema) {
            return;
        }

        const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);
        const migratedModel = await remoteModel?.migrateSchema(schema);

        await localModel.migrateSchema(schema, {
            mintOperationUrl: (operation) => {
                return migratedModel?.operations?.find((migratedOperation) => {
                    if (
                        !isInstanceOf(operation, PropertyOperation) ||
                        !isInstanceOf(migratedOperation, PropertyOperation)
                    ) {
                        return false;
                    }

                    return (
                        operation.property === migratedOperation.property &&
                        operation.date.getTime() === migratedOperation.date.getTime()
                    );
                })?.url;
            },
        });
    }

    protected async migrateChildren(localModel: SolidModel, status: MigrateModelJobStatus): Promise<void> {
        if (!isContainer(localModel)) {
            return;
        }

        const children = await this.loadContainedModels(localModel, { ignoreTombstones: true });

        status.children ??= children.map((child) => ({
            modelUrl: child.url,
            completed: false,
        }));

        for (const childStatus of status.children) {
            const child = children.find(({ url }) => childStatus.modelUrl === url);

            if (!child || childStatus.completed) {
                continue;
            }

            await this.migrate(child, childStatus);
            await this.updateProgress(() => (childStatus.completed = true));
        }
    }

}
