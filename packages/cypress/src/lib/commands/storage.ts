import { deleteDB } from 'idb';

export function resetStorage(): void {
    cy.window().then(async (window) => {
        const databases = await window.indexedDB.databases();

        for (const database of databases) {
            if (!database.name) {
                continue;
            }

            await deleteDB(database.name);
        }
    });
}
