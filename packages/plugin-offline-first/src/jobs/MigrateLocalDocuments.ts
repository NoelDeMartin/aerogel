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

export default class MigrateLocalDocuments extends Job {

    private migrations: Migration[] = [];

    public migrateCollection(modelClass: SolidModelConstructor, local: string, remote: string): void {
        this.migrations.push({
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
                const url = this.migrateUrl(id);

                await engine.create(requireUrlParentDirectory(url), this.migrateDocumentUrls(document), url);
                await engine.delete(collection, id);
            }
        }

        for (const { modelClass, local, remote } of this.migrations) {
            ignoreModelsCollection(modelClass, local);
            trackModelsCollection(modelClass, remote, { refresh: false });
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
        for (const { local, remote } of this.migrations) {
            if (!url.startsWith(local)) {
                continue;
            }

            return url.replace(local, remote);
        }

        return url;
    }

}
