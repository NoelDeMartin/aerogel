import install from '@aerogel/cypress';
import { IndexedDBEngine } from 'soukai';

beforeEach(() => {
    // Reset storage
    new IndexedDBEngine().purgeDatabase();
});

install();
