import { requireUrlParentDirectory } from '@noeldemartin/utils';
import { openDB } from 'idb';
import { IndexedDBEngine } from 'soukai';
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

export function soukaiReset(): void {
    new IndexedDBEngine().purgeDatabase();
}

export function indexedDBDocument(id: string): Cypress.Chainable<JsonLD | null> {
    return Cypress.Promise.cast(
        getIndexedDBObject<JsonLD>('soukai', requireUrlParentDirectory(id), id),
    ) as unknown as Cypress.Chainable<JsonLD | null>;
}
