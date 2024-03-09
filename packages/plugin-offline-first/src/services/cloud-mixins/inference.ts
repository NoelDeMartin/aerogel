import { arrayFilter } from '@noeldemartin/utils';
import {
    SolidContainer,
    SolidContainsRelation,
    SolidModel,
    isContainerClass,
    isSolidDocumentRelation,
} from 'soukai-solid';
import type { SolidContainerConstructor, SolidModelConstructor } from 'soukai-solid';

export default class CloudInference {

    private containerRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();
    private sameDocumentRelations: WeakMap<typeof SolidModel, string[]> = new WeakMap();

    protected getContainerRegisteredClasses(modelClass: SolidContainerConstructor): SolidModelConstructor[] {
        return arrayFilter(
            this.getContainerRelations(modelClass).map((relation) => {
                const relatedClass = modelClass
                    .instance()
                    .requireRelation<SolidContainsRelation>(relation).relatedClass;

                if (isContainerClass(relatedClass)) {
                    return false;
                }

                return relatedClass;
            }),
        );
    }

    protected getContainerRelations(modelClass: typeof SolidModel): string[] {
        if (!this.containerRelations.has(modelClass)) {
            this.containerRelations.set(
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

        return this.containerRelations.get(modelClass) ?? [];
    }

    protected getRelatedClasses(modelClass: SolidModelConstructor): SolidModelConstructor[] {
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

    protected getSameDocumentRelations(modelClass: typeof SolidModel): string[] {
        if (!this.sameDocumentRelations.has(modelClass)) {
            this.sameDocumentRelations.set(
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

        return this.sameDocumentRelations.get(modelClass) ?? [];
    }

    protected isDirtyOrHasDirtyChildren(model: SolidModel): boolean {
        if (model.isDirty()) {
            return true;
        }

        if (!(model instanceof SolidContainer)) {
            return false;
        }

        const relationHasDirtyModels = (relation: string) => {
            return model
                .getRelationModels(relation)
                ?.some((relatedModel) => this.isDirtyOrHasDirtyChildren(relatedModel));
        };

        return this.getContainerRelations(model.static()).some(relationHasDirtyModels);
    }

}
