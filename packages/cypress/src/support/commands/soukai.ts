import { IndexedDBEngine } from 'soukai';

export function resetSoukai(): void {
    new IndexedDBEngine().purgeDatabase();
}
