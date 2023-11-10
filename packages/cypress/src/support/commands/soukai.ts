import { IndexedDBEngine } from 'soukai';

export function soukaiReset(): void {
    new IndexedDBEngine().purgeDatabase();
}
