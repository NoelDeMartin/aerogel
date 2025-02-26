import { Job } from '@aerogel/core';
import { map, mixed } from '@noeldemartin/utils';
import { isContainer } from 'soukai-solid';
import type { JobListener, JobStatus } from '@aerogel/core';
import type { Nullable, ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel, SolidModelConstructor, SolidSchemaDefinition, SolidTypeIndex } from 'soukai-solid';

import { getContainerRegisteredClasses } from '@/lib/inference';
import { getRemoteClass } from '@/lib/mirroring';
import { mapFromArray } from '@/lib/utils';

import LoadsChildren from './mixins/LoadsChildren';
import LoadsTypeIndex from './mixins/LoadsTypeIndex';
import TracksLocalModels from './mixins/TracksLocalModels';

const BaseJob = Job as typeof Job<JobListener, MigrateJobStatus>;

export interface MigrateJobStatus extends JobStatus {
    children?: MigrateModelJobStatus[];
}

export interface MigrateModelJobStatus extends JobStatus {
    modelUrl: string;
    children?: MigrateModelJobStatus[];
}

export default class Migrate extends mixed(BaseJob, [LoadsChildren, LoadsTypeIndex, TracksLocalModels]) {

    protected models: SolidModel[];
    protected schemas: Map<SolidModelConstructor, SolidSchemaDefinition | SolidModelConstructor>;
    protected localModels: ObjectsMap<SolidModel>;

    constructor(
        models: SolidModel[],
        schemas:
            | Map<SolidModelConstructor, SolidSchemaDefinition | SolidModelConstructor>
            | [SolidModelConstructor, SolidSchemaDefinition | SolidModelConstructor][],
    ) {
        super();

        this.models = models;
        this.schemas = Array.isArray(schemas) ? mapFromArray(schemas) : schemas;
        this.localModels = map([], 'url');
        this.status.children = models.map((model) => ({
            modelUrl: model.url,
            completed: false,
        }));
    }

    protected async run(): Promise<void> {
        const modelStatuses = this.status.children ?? [];
        const typeIndex = await this.loadTypeIndex();

        await this.indexLocalModels(this.models);

        for (const modelStatus of modelStatuses) {
            const model = this.models.find(({ url }) => modelStatus.modelUrl === url);

            if (!model || modelStatus.completed) {
                continue;
            }

            await this.migrateRegisteredModel(model, modelStatus, typeIndex);
            await this.updateProgress(() => (modelStatus.completed = true));
        }

        for (const [modelClass, schema] of this.schemas) {
            await modelClass.updateSchema(schema);
        }
    }

    private async migrateRegisteredModel(
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
                .map((modelClass) => this.schemas.get(modelClass)?.rdfsClasses ?? modelClass.rdfsClass)
                .flat(),
        );

        await typeIndex.save();
    }

    protected async migrate(localModel: SolidModel, status: MigrateModelJobStatus): Promise<void> {
        await this.migrateChildren(localModel, status);

        const schema = this.schemas.get(localModel.static());

        if (!schema) {
            return;
        }

        const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);

        await remoteModel?.migrateSchema(schema);
        await localModel.migrateSchema(schema);
    }

    protected async migrateChildren(localModel: SolidModel, status: MigrateModelJobStatus): Promise<void> {
        if (!isContainer(localModel)) {
            return;
        }

        const children = await this.loadContainedModels(localModel);

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
