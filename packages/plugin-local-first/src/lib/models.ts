import { Solid } from '@aerogel/plugin-solid';
import { arrayFrom, objectEntries, required, urlResolveDirectory } from '@noeldemartin/utils';
import { Container, ContainsRelation, isCoreRelation } from 'soukai-bis';
import type { GetModelRelationName, Model, ModelConstructor } from 'soukai-bis';

const containerRelations: WeakMap<ModelConstructor, string[]> = new WeakMap();

export function getContainerRelations<T extends ModelConstructor>(modelClass: T): GetModelRelationName<T>[] {
    if (!containerRelations.has(modelClass)) {
        containerRelations.set(
            modelClass,
            objectEntries(modelClass.schema.relations)
                .filter(([relationName, relationInstance]) => {
                    if (isCoreRelation(relationName)) {
                        return false;
                    }

                    return relationInstance instanceof ContainsRelation;
                })
                .map(([relationName]) => relationName),
        );
    }

    return containerRelations.get(modelClass) ?? [];
}

export function getContainedModels<T extends ModelConstructor>(model: InstanceType<T>): Model[] {
    const relations = getContainerRelations(model.static());

    return relations.reduce((models, relation) => {
        return models.concat(
            arrayFrom(model.getRelation(relation).related, {
                ignoreEmptyValues: true,
            }),
        );
    }, [] as Model[]);
}

export function getRemoteContainerUrl(modelClass: ModelConstructor, path?: string): string {
    const rootStorage = Solid.requireUser().storageUrls[0];
    const containedClass =
        modelClass instanceof Container &&
        getContainerRelations(modelClass)
            .map((relation) => {
                const relatedClass = required(modelClass.schema.relations[relation]).relatedClass;

                if (relatedClass instanceof Container) {
                    return null;
                }

                return relatedClass as ModelConstructor;
            })
            .filter(Boolean)[0];

    path ??= `/${(containedClass || modelClass).modelName.toLowerCase()}s/`;

    return urlResolveDirectory((path.startsWith('/') ? rootStorage.slice(0, -1) : rootStorage) + path);
}
