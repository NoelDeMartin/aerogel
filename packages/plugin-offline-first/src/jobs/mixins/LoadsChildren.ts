import { arrayChunk, arrayFrom, isInstanceOf, map, required } from '@noeldemartin/utils';
import { DocumentNotFound } from 'soukai';
import { MalformedSolidDocumentError } from '@noeldemartin/solid-utils';
import { Tombstone } from 'soukai-solid';
import type { JobStatus } from '@aerogel/core';
import type { ObjectsMap } from '@noeldemartin/utils';
import type { SolidContainer, SolidContainsRelation, SolidDocument, SolidModel } from 'soukai-solid';

import DocumentsCache from '@/services/DocumentsCache';
import { cloneLocalModel, isLocalModel } from '@/lib/mirroring';
import { getContainerRelations } from '@/lib/inference';
import { lazy } from '@/lib/utils';

export interface ResourceJobStatus extends JobStatus {
    documentUrl?: string;
    children?: ResourceJobStatus[];
}

export default class LoadsChildren {

    protected declare localModels?: ObjectsMap<SolidModel>;

    protected async loadContainedModels(
        model: SolidContainer,
        options: {
            ignoreTombstones?: boolean;
            status?: ResourceJobStatus;
            onLoaded?: (urls: string[]) => unknown;
            onMalformedDocument?: (url: string) => unknown;
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
                        await this.loadDocumentChildren(model, documentUrl, documents, options.onMalformedDocument);

                    tombstones.push(...documentTombstones);

                    for (const [relation, documentModels] of Object.entries(documentChildren)) {
                        const relationChildren = (children[relation] ??= []);

                        relationChildren.push(...documentModels);
                    }
                }),
            );

            for (const documentUrl of documentUrls) {
                if (documentUrl.endsWith('/')) {
                    continue;
                }

                required(statusChildrenMap.get(documentUrl)).completed = true;
            }

            await options.onLoaded?.(documentUrls);
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

    protected async loadDocumentChildren(
        model: SolidModel,
        documentUrl: string,
        documents: ObjectsMap<SolidDocument>,
        onMalformedDocument?: (url: string) => unknown,
    ): Promise<{ children: Record<string, SolidModel[]>; tombstones: Tombstone[] }> {
        const document = documents.get(documentUrl);

        if (
            document &&
            (await DocumentsCache.isFresh(document.url, document.updatedAt ?? new Date())) &&
            this.localModels?.hasKey(model.url)
        ) {
            return {
                children: await this.loadDocumentChildrenFromLocal(model, document),
                tombstones: [],
            };
        }

        return this.loadDocumentChildrenFromRemote(model, documentUrl, onMalformedDocument);
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

            const relatedLocalModels = this.localModels?.get(model.url)?.getRelationModels(relation) ?? [];

            children[relation] = relatedLocalModels
                .filter((relatedLocalModel) => relatedLocalModel.getDocumentUrl() === document.url)
                .map((relatedLocalModel) => cloneLocalModel(relatedLocalModel, { clean: true }));
        }

        return children;
    }

    protected async loadDocumentChildrenFromRemote(
        model: SolidModel,
        documentUrl: string,
        onMalformedDocument?: (url: string) => unknown,
    ): Promise<{ children: Record<string, SolidModel[]>; tombstones: Tombstone[] }> {
        const children: Record<string, SolidModel[]> = {};
        const tombstones: Tombstone[] = [];
        const readDocument = lazy(async () => {
            try {
                const document = await model.requireEngine().readOne(model.static('collection'), documentUrl);
                const documentTombstones = await Tombstone.createManyFromEngineDocuments({
                    [documentUrl]: document,
                });

                tombstones.push(...documentTombstones);

                return document;
            } catch (error) {
                if (isInstanceOf(error, DocumentNotFound)) {
                    return null;
                }

                if (isInstanceOf(error, MalformedSolidDocumentError)) {
                    // eslint-disable-next-line no-console
                    console.warn(error.message);

                    await onMalformedDocument?.(documentUrl);

                    return null;
                }

                throw error;
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

        return { children, tombstones };
    }

}
