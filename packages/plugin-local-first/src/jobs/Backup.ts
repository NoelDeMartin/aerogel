import { Job } from '@aerogel/core';
import { requireEngine } from 'soukai';
import { requireUrlParentDirectory } from '@noeldemartin/utils';
import { ignoreModelsCollection, trackModelsCollection } from '@aerogel/plugin-soukai';
import { Solid } from '@aerogel/plugin-solid';
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

    protected async run(): Promise<void> {
        const engine = requireEngine<IndexedDBEngine>();
        const collections = await engine.getCollections();
        const droppedCollections = new Set<string>();

        for (const collection of collections) {
            const documents = await engine.readMany(collection);

            for (const [localUrl, document] of Object.entries(documents)) {
                const remoteUrl = this.replaceUrl(localUrl);

                await engine.create(
                    requireUrlParentDirectory(remoteUrl),
                    this.replaceDocumentUrls(document),
                    remoteUrl,
                );

                await engine.delete(collection, localUrl);
            }
        }

        for (const { modelClass, remote } of this.urlMigrations) {
            trackModelsCollection(modelClass, requireUrlParentDirectory(remote));
        }

        for (const { modelClass, local, remote } of this.collectionMigrations) {
            const solidCollections = Object.assign({}, Solid.collections);
            const filteredCollections = (Solid.collections[modelClass.modelName] ?? []).filter(
                (collection) => !local.startsWith(collection),
            );

            ignoreModelsCollection(modelClass, local);
            trackModelsCollection(modelClass, remote);

            for (const localCollection of Solid.collections[modelClass.modelName] ?? []) {
                const remoteCollection = this.replaceUrl(localCollection);

                if (remoteCollection !== localCollection) {
                    ignoreModelsCollection(modelClass, localCollection);
                    trackModelsCollection(modelClass, remoteCollection);
                }
            }

            Solid.collections = solidCollections;

            collections
                .filter((collection) => local.startsWith(collection))
                .forEach((collection) => droppedCollections.add(collection));

            if (filteredCollections.length > 0) {
                solidCollections[modelClass.modelName] = filteredCollections;
            } else {
                delete solidCollections[modelClass.modelName];
            }
        }

        await engine.dropCollections(Array.from(droppedCollections));
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
