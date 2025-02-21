import { Job } from '@aerogel/core';
import { map, mixed } from '@noeldemartin/utils';
import { isContainer } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidModel, SolidModelConstructor, SolidSchemaDefinition } from 'soukai-solid';

import { getRemoteClass } from '@/lib/mirroring';

import LoadsChildren from './mixins/LoadsChildren';
import LoadsTypeIndex from './mixins/LoadsTypeIndex';
import TracksLocalModels from './mixins/TracksLocalModels';
import { getContainerRegisteredClasses } from '@/lib/inference';

export default class Migrate extends mixed(Job, [LoadsChildren, LoadsTypeIndex, TracksLocalModels]) {

    protected models: SolidModel[];
    protected schemas: Map<SolidModelConstructor, SolidSchemaDefinition | SolidModelConstructor>;
    protected localModels: ObjectsMap<SolidModel>;

    constructor(
        models: SolidModel[],
        schemas: Map<SolidModelConstructor, SolidSchemaDefinition | SolidModelConstructor>,
    ) {
        super();

        this.models = models;
        this.schemas = schemas;
        this.localModels = map([], 'url');
    }

    public async run(): Promise<void> {
        const typeIndex = await this.loadTypeIndex();

        await this.indexLocalModels(this.models);

        for (const model of this.models) {
            await this.migrate(model);

            if (!isContainer(model)) {
                continue;
            }

            const registeredClasses = getContainerRegisteredClasses(model.static());
            const registration = typeIndex?.registrations.find(
                ({ instanceContainer }) => instanceContainer === model.url,
            );

            if (!registration || registeredClasses.length === 0) {
                continue;
            }

            registration.setAttribute(
                'forClass',
                registeredClasses
                    .map((modelClass) => this.schemas.get(modelClass)?.rdfsClasses ?? modelClass.rdfsClass)
                    .flat(),
            );
        }

        await typeIndex?.save();

        for (const [modelClass, schema] of this.schemas) {
            await modelClass.updateSchema(schema);
        }
    }

    protected async migrate(localModel: SolidModel): Promise<void> {
        await this.migrateChildren(localModel);

        const schema = this.schemas.get(localModel.static());

        if (!schema) {
            return;
        }

        const remoteModel = await getRemoteClass(localModel.static()).find(localModel.url);

        await remoteModel?.migrateSchema(schema);
        await localModel.migrateSchema(schema);
    }

    protected async migrateChildren(localModel: SolidModel): Promise<void> {
        if (!isContainer(localModel)) {
            return;
        }

        const children = await this.loadContainedModels(localModel);

        for (const child of children) {
            await this.migrate(child);
        }
    }

}
