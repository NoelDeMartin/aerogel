import { deleteDB } from 'idb';

export function resetStorage(): Cypress.Chainable<null> {
    return Cypress.Promise.cast(async () => {
        const databases = await indexedDB.databases();

        for (const database of databases) {
            if (!database.name) {
                continue;
            }

            await deleteDB(database.name);
        }
    }) as unknown as Cypress.Chainable<null>;
}
