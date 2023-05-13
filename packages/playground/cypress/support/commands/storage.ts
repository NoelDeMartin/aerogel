import { IndexedDBEngine } from 'soukai';

export function resetStorage(): void {
    Cypress.Promise.resolve(new IndexedDBEngine().purgeDatabase());
}
