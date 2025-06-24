import { arrayChunk, arrayFrom, isInstanceOf, map, required } from '@noeldemartin/utils';
import { DocumentNotFound, type EngineDocument } from 'soukai';
import { Tombstone } from 'soukai-solid';
import type { JobStatus } from '@aerogel/core';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainer, SolidContainsRelation, SolidDocument, SolidModel } from 'soukai-solid';

import DocumentsCache from '@aerogel/plugin-local-first/services/DocumentsCache';
import { cloneLocalModel, getLocalClass, isLocalModel, isRemoteModel } from '@aerogel/plugin-local-first/lib/mirroring';
import { getContainerRelations } from '@aerogel/plugin-local-first/lib/inference';
import { lazy } from '@aerogel/plugin-local-first/lib/utils';

export interface ResourceJobStatus extends JobStatus {
    documentUrl?: string;
    children?: ResourceJobStatus[];
}

export default class LoadsChildren {

    declare protected localModels?: ObjectsMap<SolidModel>;

    protected async loadContainedModels(
        model: SolidContainer,
        options: {
            ignoreTombstones?: boolean;
            status?: ResourceJobStatus;
            onDocumentLoaded?: () => unknown;
            onDocumentError?: (error: unknown) => unknown;
            onDocumentRead?: (document: SolidDocument) => unknown;
        } = {},
    ): Promise<SolidModel[]> {
        if (isLocalModel(model)) {
            const children = [];

            for (const relation of getContainerRelations(model.static())) {
                const relationModels =
                    (await model.loadRelationIfUnloaded<SolidModel | SolidModel[] | null>(relation)) ?? [];

                children.push(...arrayFrom(relationModels));
            }

            return children;
        }

        const children: Record<string, SolidModel[]> = {};
        const tombstones: Tombstone[] = [];
        const documents = map(model.documents, 'url');
        const documentUrlChunks = arrayChunk(model.resourceUrls, 10);
        const statusChildren = documentUrlChunks.flat().map((url) => ({
            documentUrl: url,
            completed: false,
        }));
        const statusChildrenMap = map(statusChildren, 'documentUrl');

        if (options.status) {
            options.status.children = statusChildren;
        }

        for (const documentUrls of documentUrlChunks) {
            await Promise.all(
                documentUrls.map(async (documentUrl) => {
                    const { children: documentChildren, tombstones: documentTombstones } =
                        await this.loadDocumentChildren(
                            model,
                            documentUrl,
                            documents,
                            options.onDocumentError,
                            options.onDocumentRead,
                        );

                    tombstones.push(...documentTombstones);

                    for (const [relation, documentModels] of Object.entries(documentChildren)) {
                        const relationChildren = (children[relation] ??= []);

                        relationChildren.push(...documentModels);
                    }

                    if (documentUrl.endsWith('/')) {
                        return;
                    }

                    required(statusChildrenMap.get(documentUrl)).completed = true;

                    await options.onDocumentLoaded?.();
                }),
            );
        }

        for (const [relation, relationModels] of Object.entries(children)) {
            model.setRelationModels(relation, relationModels);
        }

        const childrenArray = options.ignoreTombstones
            ? Object.values(children).flat()
            : Object.values(children).flat().concat(tombstones);

        if (options.status) {
            options.status.children = childrenArray.map((child) => {
                return required(statusChildrenMap.get(child.requireDocumentUrl()));
            });
        }

        return childrenArray;
    }

    protected async loadContainedDocuments(
        model: SolidContainer,
        options: {
            status?: ResourceJobStatus;
            onDocumentLoaded?: () => unknown;
            onDocumentError?: (error: unknown) => unknown;
            onDocumentRead?: (document: SolidDocument) => unknown;
        } = {},
    ): Promise<Record<string, EngineDocument>> {
        if (!isRemoteModel(model)) {
            throw Error('Cannot get contained models from local model');
        }

        const engineDocuments: Record<string, EngineDocument> = {};
        const documentModels = map(model.documents, 'url');
        const localEngine = getLocalClass(model.static()).requireEngine();
        const remoteEngine = model.requireEngine();

        for (let index = 0; index < model.resourceUrls.length; index++) {
            const documentUrl = model.resourceUrls[index];

            if (!documentUrl || documentUrl.endsWith('/')) {
                continue;
            }

            const documentModel = documentModels.get(documentUrl);

            if (
                documentModel &&
                documentModel.updatedAt &&
                (await DocumentsCache.isFresh(documentModel.url, documentModel.updatedAt)) &&
                this.localModels?.hasKey(model.url)
            ) {
                try {
                    engineDocuments[documentUrl] = await localEngine.readOne(model.url, documentUrl);

                    options.onDocumentRead?.(documentModel);
                } catch (error) {
                    if (isInstanceOf(error, DocumentNotFound)) {
                        continue;
                    }

                    if (!options.onDocumentError) {
                        throw error;
                    }

                    options.onDocumentError(error);

                    continue;
                }
            } else {
                engineDocuments[documentUrl] = await remoteEngine.readOne(model.url, documentUrl);
            }

            const childStatus = options.status?.children?.[index];

            if (childStatus) {
                childStatus.completed = true;
            }

            await options.onDocumentLoaded?.();
        }

        return engineDocuments;
    }

    private async loadDocumentChildren(
        model: SolidContainer,
        documentUrl: string,
        documents: ObjectsMap<SolidDocument>,
        onDocumentError?: (error: unknown) => unknown,
        onDocumentRead?: (document: SolidDocument) => unknown,
    ): Promise<{ children: Record<string, SolidModel[]>; tombstones: Tombstone[] }> {
        const document = documents.get(documentUrl);

        if (
            document &&
            document.updatedAt &&
            (await DocumentsCache.isFresh(document.url, document.updatedAt)) &&
            this.localModels?.hasKey(model.url)
        ) {
            return {
                children: await this.loadDocumentChildrenFromLocal(model, document),
                tombstones: [],
            };
        }

        return this.loadDocumentChildrenFromRemote(model, documentUrl, onDocumentError, onDocumentRead);
    }

    private async loadDocumentChildrenFromLocal(
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

            const relatedLocalModels = this.localModels?.get(model.url)?.getRelationModels(relation) ?? [];

            children[relation] = relatedLocalModels
                .filter((relatedLocalModel) => relatedLocalModel.getDocumentUrl() === document.url)
                .map((relatedLocalModel) => cloneLocalModel(relatedLocalModel, { clean: true }));
        }

        return children;
    }

    private async loadDocumentChildrenFromRemote(
        model: SolidContainer,
        documentUrl: string,
        onDocumentError?: (error: unknown) => unknown,
        onDocumentRead?: (document: SolidDocument) => unknown,
    ): Promise<{ children: Record<string, SolidModel[]>; tombstones: Tombstone[] }> {
        const children: Record<string, SolidModel[]> = {};
        const tombstones: Tombstone[] = [];
        const readDocument = lazy(async () => {
            try {
                const documentModel = model.documents.find((document) => document.url === documentUrl);
                const document = await model.requireEngine().readOne(model.static('collection'), documentUrl);
                const documentTombstones = await Tombstone.createManyFromEngineDocuments({
                    [documentUrl]: document,
                });

                tombstones.push(...documentTombstones);

                if (documentModel) {
                    onDocumentRead?.(documentModel);
                }

                return document;
            } catch (error) {
                if (isInstanceOf(error, DocumentNotFound)) {
                    return null;
                }

                if (!onDocumentError) {
                    throw error;
                }

                onDocumentError(error);

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

            try {
                const documentChildren = await relationInstance.relatedClass.createManyFromEngineDocuments({
                    [documentUrl]: document,
                });

                children[relation] = documentChildren;
            } catch (error) {
                if (!onDocumentError) {
                    throw error;
                }

                onDocumentError(error);
            }
        }

        return { children, tombstones };
    }

}
