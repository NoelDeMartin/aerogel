import { Solid } from '@aerogel/plugin-solid';
import { arrayFrom, isSubclassOf, objectEntries, required, urlResolveDirectory } from '@noeldemartin/utils';
import { ContainsRelation, getRelatedClass, isContainerClass, isCoreRelation } from 'soukai-bis';
import type { GetModelRelationName, Model, ModelConstructor, RelationConstructor } from 'soukai-bis';

const containerRelations: WeakMap<ModelConstructor, string[]> = new WeakMap();

function isContainsRelationClass(relationClass: RelationConstructor): boolean {
    return relationClass === ContainsRelation || isSubclassOf(relationClass, ContainsRelation);
}

function getContainerRelations<T extends ModelConstructor>(modelClass: T): GetModelRelationName<T>[] {
    if (!containerRelations.has(modelClass)) {
        containerRelations.set(
            modelClass,
            objectEntries(modelClass.schema.relations)
                .filter(([relationName, relationDefinition]) => {
                    if (isCoreRelation(relationName)) {
                        return false;
                    }

                    return isContainsRelationClass(relationDefinition.relationClass);
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
        isContainerClass(modelClass) &&
        getContainerRelations(modelClass)
            .map((relation) => {
                const relatedClass = getRelatedClass(modelClass, required(modelClass.schema.relations[relation]));

                if (isContainerClass(relatedClass)) {
                    return null;
                }

                return relatedClass;
            })
            .filter(Boolean)[0];

    path ??= `/${(containedClass || modelClass).modelName.toLowerCase()}s/`;

    return urlResolveDirectory((path.startsWith('/') ? rootStorage.slice(0, -1) : rootStorage) + path);
}
