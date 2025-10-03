import { arrayChunk, arrayFrom, isInstanceOf, map, requireUrlParentDirectory, required } from '@noeldemartin/utils';
import { DocumentNotFound, type EngineDocument } from 'soukai';
import { Tombstone } from 'soukai-solid';
import type { JobStatus } from '@aerogel/core';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainer, SolidContainsRelation, SolidDocument, SolidModel } from 'soukai-solid';

import { isLocalModel, isRemoteModel } from '@aerogel/plugin-local-first/lib/mirroring';
import { getContainerRelations } from '@aerogel/plugin-local-first/lib/inference';
import { lazy } from '@aerogel/plugin-local-first/lib/utils';

export interface ResourceJobStatus extends JobStatus {
    documentUrl?: string;
    children?: ResourceJobStatus[];
}

export default class LoadsChildren {

    declare protected localModels?: ObjectsMap<SolidModel>;

    protected async loadContainedModels(
        container: SolidContainer,
        options: {
            ignoreTombstones?: boolean;
            status?: ResourceJobStatus;
            onDocumentLoaded?: () => unknown;
            onDocumentError?: (error: unknown) => unknown;
            onDocumentRead?: (document: SolidDocument) => unknown;
        } = {},
    ): Promise<SolidModel[]> {
        if (isLocalModel(container)) {
            const children = [];

            for (const relation of getContainerRelations(container.static())) {
                const relationModels =
                    (await container.loadRelationIfUnloaded<SolidModel | SolidModel[] | null>(relation)) ?? [];

                children.push(...arrayFrom(relationModels));
            }

            return children;
        }

        const children: Record<string, SolidModel[]> = {};
        const tombstones: Tombstone[] = [];
        const documents = map(container.documents, 'url');
        const resourceUrlChunks = arrayChunk(container.resourceUrls, 10);
        const statusChildren = resourceUrlChunks.flat().map((url) => ({
            documentUrl: url,
            completed: false,
        }));
        const statusChildrenMap = map(statusChildren, 'documentUrl');

        if (options.status) {
            options.status.children = statusChildren;
        }

        for (const resourceUrls of resourceUrlChunks) {
            await Promise.all(
                resourceUrls.map(async (resourceUrl) => {
                    if (
                        container.resources.some(
                            (resource) =>
                                resource.url === resourceUrl &&
                                resource.types.some((type) =>
                                    type.startsWith('http://www.w3.org/ns/iana/media-types/image/')),
                        )
                    ) {
                        return;
                    }

                    const { children: documentChildren, tombstones: documentTombstones } =
                        await this.loadDocumentChildren(
                            container,
                            resourceUrl,
                            documents,
                            options.onDocumentError,
                            options.onDocumentRead,
                        );

                    tombstones.push(...documentTombstones);

                    for (const [relation, documentModels] of Object.entries(documentChildren)) {
                        const relationChildren = (children[relation] ??= []);

                        relationChildren.push(...documentModels);
                    }

                    if (resourceUrl.endsWith('/')) {
                        return;
                    }

                    required(statusChildrenMap.get(resourceUrl)).completed = true;

                    await options.onDocumentLoaded?.();
                }),
            );
        }

        for (const [relation, relationModels] of Object.entries(children)) {
            container.setRelationModels(relation, relationModels);
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
        container: SolidContainer,
        options: {
            status?: ResourceJobStatus;
            onDocumentLoaded?: () => unknown;
            onDocumentError?: (error: unknown) => unknown;
            onDocumentRead?: (document: SolidDocument) => unknown;
        } = {},
    ): Promise<Record<string, EngineDocument>> {
        if (!isRemoteModel(container)) {
            throw Error('Cannot get contained models from local model');
        }

        const engineDocuments: Record<string, EngineDocument> = {};
        const remoteEngine = container.requireEngine();
        const resourceUrlChunks = arrayChunk(container.resourceUrls, 10);
        const statusChildren = resourceUrlChunks.flat().map((url) => ({
            documentUrl: url,
            completed: false,
        }));
        const statusChildrenMap = map(statusChildren, 'documentUrl');

        for (const resourceUrls of resourceUrlChunks) {
            await Promise.all(
                resourceUrls.map(async (resourceUrl) => {
                    if (
                        !resourceUrl ||
                        resourceUrl.endsWith('/') ||
                        container.resources.some(
                            (resource) =>
                                resource.url === resourceUrl &&
                                resource.types.some((type) =>
                                    type.startsWith('http://www.w3.org/ns/iana/media-types/image/')),
                        )
                    ) {
                        required(statusChildrenMap.get(resourceUrl)).completed = true;

                        return;
                    }

                    const document = container.documents.find(({ url }) => url === resourceUrl);

                    try {
                        engineDocuments[resourceUrl] = await remoteEngine.readOne(container.url, resourceUrl);
                    } catch (error) {
                        if (!options.onDocumentError) {
                            throw error;
                        }

                        await options.onDocumentError?.(error);
                    }

                    if (document) {
                        await options.onDocumentRead?.(document);
                    }

                    await options.onDocumentLoaded?.();

                    required(statusChildrenMap.get(resourceUrl)).completed = true;
                }),
            );
        }

        return engineDocuments;
    }

    private async loadDocumentChildren(
        container: SolidContainer,
        documentUrl: string,
        documents: ObjectsMap<SolidDocument>,
        onDocumentError?: (error: unknown) => unknown,
        onDocumentRead?: (document: SolidDocument) => unknown,
    ): Promise<{ children: Record<string, SolidModel[]>; tombstones: Tombstone[] }> {
        return this.loadDocumentChildrenFromRemote(container, documentUrl, onDocumentError, onDocumentRead);
    }

    private async loadDocumentChildrenFromRemote(
        container: SolidContainer,
        documentUrl: string,
        onDocumentError?: (error: unknown) => unknown,
        onDocumentRead?: (document: SolidDocument) => unknown,
    ): Promise<{ children: Record<string, SolidModel[]>; tombstones: Tombstone[] }> {
        const children: Record<string, SolidModel[]> = {};
        const tombstones: Tombstone[] = [];
        const readDocument = lazy(async () => {
            try {
                const documentModel = container.documents.find((document) => document.url === documentUrl);
                const document = await container
                    .requireEngine()
                    .readOne(requireUrlParentDirectory(documentUrl), documentUrl);
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

        for (const relation of getContainerRelations(container.static())) {
            const relationInstance = container.requireRelation<SolidContainsRelation>(relation);

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
