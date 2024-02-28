import { Job } from '@aerogel/core';
import { requireEngine } from 'soukai';
import { requireUrlParentDirectory } from '@noeldemartin/utils';
import type { EngineDocument, IndexedDBEngine } from 'soukai';

export default class MigrateLocalDocuments extends Job {

    private collections: Record<string, string> = {};

    public migrateCollection(local: string, remote: string): void {
        this.collections[local] = remote;
    }

    public async run(): Promise<void> {
        const engine = requireEngine<IndexedDBEngine>();
        const collections = await engine.getCollections();

        for (const collection of collections) {
            const documents = await engine.readMany(collection);

            for (const [id, document] of Object.entries(documents)) {
                const url = this.migrateUrl(id);

                await engine.create(requireUrlParentDirectory(url), this.migrateDocumentUrls(document), url);
                await engine.delete(collection, id);
            }
        }
    }

    protected migrateDocumentUrls(document: EngineDocument): EngineDocument {
        for (const [key, value] of Object.entries(document)) {
            if (key === '@id' && typeof value === 'string') {
                document[key] = this.migrateUrl(value);

                continue;
            }

            if (typeof value !== 'object' || value === null) {
                continue;
            }

            document[key] = this.migrateDocumentUrls(value as EngineDocument);
        }

        return document;
    }

    protected migrateUrl(url: string): string {
        for (const [localCollection, remoteCollection] of Object.entries(this.collections)) {
            if (!url.startsWith(localCollection)) {
                continue;
            }

            return url.replace(localCollection, remoteCollection);
        }

        return url;
    }

}
