import { arrayFilter } from '@noeldemartin/utils';
import {
    SolidContainer,
    SolidContainsRelation,
    SolidModel,
    isContainerClass,
    isSolidDocumentRelation,
} from 'soukai-solid';
import type { SolidContainerConstructor, SolidModelConstructor } from 'soukai-solid';

const containerRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();
const sameDocumentRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();

export function getContainerRegisteredClasses(modelClass: SolidContainerConstructor): SolidModelConstructor[] {
    return arrayFilter(
        getContainerRelations(modelClass).map((relation) => {
            const relatedClass = modelClass.instance().requireRelation<SolidContainsRelation>(relation).relatedClass;

            if (isContainerClass(relatedClass)) {
                return false;
            }

            return relatedClass;
        }),
    );
}

export function getContainerRelations(modelClass: typeof SolidModel): string[] {
    if (!containerRelations.has(modelClass)) {
        containerRelations.set(
            modelClass,
            modelClass.relations.filter((relation) => {
                if (SolidModel.reservedRelations.includes(relation)) {
                    return false;
                }

                const relationInstance = modelClass.instance().requireRelation(relation);

                return relationInstance instanceof SolidContainsRelation;
            }),
        );
    }

    return containerRelations.get(modelClass) ?? [];
}

export function getRelatedClasses(modelClass: SolidModelConstructor): SolidModelConstructor[] {
    const relatedClasses = new Set<SolidModelConstructor>();
    const instance = modelClass.instance();

    relatedClasses.add(modelClass);

    for (const relation of modelClass.relations) {
        if (modelClass.reservedRelations.includes(relation)) {
            continue;
        }

        relatedClasses.add(instance.requireRelation(relation).relatedClass);
    }

    return [...relatedClasses.values()];
}

export function getSameDocumentRelations(modelClass: typeof SolidModel): string[] {
    if (!sameDocumentRelations.has(modelClass)) {
        sameDocumentRelations.set(
            modelClass,
            modelClass.relations.filter((relation) => {
                if (SolidModel.reservedRelations.includes(relation)) {
                    return false;
                }

                const relationInstance = modelClass.instance().requireRelation(relation);

                return isSolidDocumentRelation(relationInstance) && relationInstance.useSameDocument;
            }),
        );
    }

    return sameDocumentRelations.get(modelClass) ?? [];
}

export function isDirtyOrHasDirtyChildren(model: SolidModel): boolean {
    if (model.isDirty()) {
        return true;
    }

    if (!(model instanceof SolidContainer)) {
        return false;
    }

    const relationHasDirtyModels = (relation: string) => {
        return model.getRelationModels(relation)?.some((relatedModel) => isDirtyOrHasDirtyChildren(relatedModel));
    };

    return getContainerRelations(model.static()).some(relationHasDirtyModels);
}
