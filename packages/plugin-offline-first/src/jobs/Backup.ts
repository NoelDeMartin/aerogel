import { Job } from '@aerogel/core';
import { requireEngine } from 'soukai';
import { requireUrlParentDirectory } from '@noeldemartin/utils';
import { ignoreModelsCollection, trackModelsCollection } from '@aerogel/plugin-soukai';
import type { EngineDocument, IndexedDBEngine } from 'soukai';
import type { SolidModelConstructor } from 'soukai-solid';

interface Migration {
    modelClass: SolidModelConstructor;
    local: string;
    remote: string;
}

export default class Backup extends Job {

    private urlMigrations: Migration[] = [];
    private collectionMigrations: Migration[] = [];

    public migrateUrl(modelClass: SolidModelConstructor, local: string, remote: string): void {
        this.urlMigrations.push({
            modelClass,
            local,
            remote,
        });
    }

    public migrateCollection(modelClass: SolidModelConstructor, local: string, remote: string): void {
        this.collectionMigrations.push({
            modelClass,
            local,
            remote,
        });
    }

    public async run(): Promise<void> {
        const engine = requireEngine<IndexedDBEngine>();
        const collections = await engine.getCollections();

        for (const collection of collections) {
            const documents = await engine.readMany(collection);

            for (const [id, document] of Object.entries(documents)) {
                const url = this.replaceUrl(id);

                await engine.create(requireUrlParentDirectory(url), this.replaceDocumentUrls(document), url);
                await engine.delete(collection, id);
            }
        }

        for (const { modelClass, remote } of this.urlMigrations) {
            trackModelsCollection(modelClass, requireUrlParentDirectory(remote), { refresh: false });
        }

        for (const { modelClass, local, remote } of this.collectionMigrations) {
            ignoreModelsCollection(modelClass, local);
            trackModelsCollection(modelClass, remote, { refresh: false });
        }
    }

    protected replaceDocumentUrls(document: EngineDocument): EngineDocument {
        for (const [key, value] of Object.entries(document)) {
            if (key === '@id' && typeof value === 'string') {
                document[key] = this.replaceUrl(value);

                continue;
            }

            if (typeof value !== 'object' || value === null) {
                continue;
            }

            document[key] = this.replaceDocumentUrls(value as EngineDocument);
        }

        return document;
    }

    protected replaceUrl(url: string): string {
        for (const { local, remote } of this.urlMigrations) {
            if (!url.startsWith(local)) {
                continue;
            }

            return url.replace(local, remote);
        }

        for (const { local, remote } of this.collectionMigrations) {
            if (!url.startsWith(local)) {
                continue;
            }

            return url.replace(local, remote);
        }

        return url;
    }

}
