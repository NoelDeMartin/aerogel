import { setupAerogelSupport } from '@aerogel/cypress/lib';

setupAerogelSupport();

beforeEach(() => cy.resetStorage());
