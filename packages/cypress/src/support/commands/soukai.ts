import { IndexedDBEngine } from 'soukai';
import type { ModelConstructor, ModelsRegistry } from 'soukai';

export function model<T extends keyof ModelsRegistry>(name: T): Cypress.Chainable<ModelsRegistry[T]>;
export function model<T extends ModelConstructor = ModelConstructor>(name: string): Cypress.Chainable<T>;
export function model(name: string): Cypress.Chainable<ModelConstructor> {
    return cy.testingRuntime().then((runtime) => runtime.model(name));
}

export function soukaiReset(): void {
    new IndexedDBEngine().purgeDatabase();
}
