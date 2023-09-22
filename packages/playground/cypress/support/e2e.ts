import install from '@aerogel/cypress';
import { IndexedDBEngine } from 'soukai';

beforeEach(() => {
    new IndexedDBEngine().purgeDatabase();
    cy.task('resetSolidPOD');
});

install();
