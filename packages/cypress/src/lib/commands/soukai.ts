import { requireUrlParentDirectory } from '@noeldemartin/utils';
import { openDB } from 'idb';
import type { JsonLD } from '@noeldemartin/solid-utils';
import type { ModelConstructor, ModelsRegistry } from 'soukai';

async function getIndexedDBObject<T = object>(database: string, store: string, id: string): Promise<T | null> {
    try {
        const db = await openDB(database);
        const result = await db.get(store, id);

        db.close();

        return result ?? null;
    } catch (error) {
        return null;
    }
}

export function model<T extends keyof ModelsRegistry>(name: T): Cypress.Chainable<ModelsRegistry[T]>;
export function model<T extends ModelConstructor = ModelConstructor>(name: string): Cypress.Chainable<T>;
export function model(name: string): Cypress.Chainable<ModelConstructor> {
    return cy.testingRuntime().then((runtime) => runtime.model(name));
}

export function soukaiIndexedDBDocument(id: string): Cypress.Chainable<JsonLD | null> {
    return cy.window().then(async (window) => {
        const databases = await window.indexedDB.databases();
        const database = databases.find((db) => db.name?.startsWith('soukai') && !db.name?.endsWith('meta'));

        if (!database?.name) {
            return null;
        }

        return getIndexedDBObject<JsonLD>(database.name, requireUrlParentDirectory(id), id);
    });
}
