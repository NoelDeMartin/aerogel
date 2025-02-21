import { arrayFrom, isInstanceOf, map } from '@noeldemartin/utils';
import { DocumentNotFound } from 'soukai';
import type { SolidContainer, SolidContainsRelation, SolidDocument, SolidModel } from 'soukai-solid';
import type { ObjectsMap } from '@noeldemartin/utils';

import DocumentsCache from '@/services/DocumentsCache';
import { cloneLocalModel, isRemoteModel } from '@/lib/mirroring';
import { getContainerRelations } from '@/lib/inference';
import { lazy } from '@/lib/utils';

export default class LoadsChildren {

    protected declare localModels: ObjectsMap<SolidModel>;

    protected async loadContainedModels(model: SolidContainer): Promise<SolidModel[]> {
        if (!isRemoteModel(model)) {
            const children = [];

            for (const relation of getContainerRelations(model.static())) {
                const relationModels =
                    (await model.loadRelationIfUnloaded<SolidModel | SolidModel[] | null>(relation)) ?? [];

                children.push(...arrayFrom(relationModels));
            }

            return children;
        }

        const children: Record<string, SolidModel[]> = {};
        const documents = map(model.documents, 'url');

        for (const documentUrl of model.resourceUrls) {
            const documentChildren = await this.loadDocumentChildren(model, documentUrl, documents);

            for (const [relation, documentModels] of Object.entries(documentChildren)) {
                const relationChildren = (children[relation] ??= []);

                relationChildren.push(...documentModels);
            }
        }

        for (const [relation, relationModels] of Object.entries(children)) {
            model.setRelationModels(relation, relationModels);
        }

        return Object.values(children).flat();
    }

    protected async loadDocumentChildren(
        model: SolidModel,
        documentUrl: string,
        documents: ObjectsMap<SolidDocument>,
    ): Promise<Record<string, SolidModel[]>> {
        const document = documents.get(documentUrl);

        if (
            document &&
            (await DocumentsCache.isFresh(document.url, document.updatedAt ?? new Date())) &&
            this.localModels.hasKey(model.url)
        ) {
            return this.loadDocumentChildrenFromLocal(model, document);
        }

        return this.loadDocumentChildrenFromRemote(model, documentUrl);
    }

    protected async loadDocumentChildrenFromLocal(
        model: SolidModel,
        document: SolidDocument,
    ): Promise<Record<string, SolidModel[]>> {
        const children: Record<string, SolidModel[]> = {};

        for (const relation of getContainerRelations(model.static())) {
            const relationInstance = model.requireRelation<SolidContainsRelation>(relation);

            if (relationInstance.loaded) {
                children[relation] = relationInstance.getLoadedModels();

                continue;
            }

            const relatedLocalModels = this.localModels.get(model.url)?.getRelationModels(relation) ?? [];

            children[relation] = relatedLocalModels
                .filter((relatedLocalModel) => relatedLocalModel.getDocumentUrl() === document.url)
                .map((relatedLocalModel) => cloneLocalModel(relatedLocalModel, { clean: true }));
        }

        return children;
    }

    protected async loadDocumentChildrenFromRemote(
        model: SolidModel,
        documentUrl: string,
    ): Promise<Record<string, SolidModel[]>> {
        const children: Record<string, SolidModel[]> = {};
        const readDocument = lazy(async () => {
            try {
                const document = await model.requireEngine().readOne(model.static('collection'), documentUrl);

                return document;
            } catch (error) {
                if (!isInstanceOf(error, DocumentNotFound)) {
                    throw error;
                }

                return null;
            }
        });

        for (const relation of getContainerRelations(model.static())) {
            const relationInstance = model.requireRelation<SolidContainsRelation>(relation);

            if (relationInstance.loaded) {
                children[relation] = relationInstance.getLoadedModels();

                continue;
            }

            const document = await readDocument();

            if (!document) {
                continue;
            }

            const documentChildren = await relationInstance.relatedClass.createManyFromEngineDocuments({
                [documentUrl]: document,
            });

            children[relation] = documentChildren;
        }

        if (!documentUrl.endsWith('/')) {
            // For now, we're only caching non-container documents, given that not all POD providers
            // will update a container's modification date when a child document is changed.
            DocumentsCache.remember(documentUrl, new Date());
        }

        return children;
    }

}
