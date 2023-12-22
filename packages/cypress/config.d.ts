/// <reference types="cypress" />

import type { CypressSolidConfig } from 'cypress-solid';

declare module '@aerogel/cypress/config' {
    export function setupAerogelNodeEvents(
        on: Cypress.PluginEvents,
        config: Cypress.PluginConfigOptions,
        solidConfig?: Partial<CypressSolidConfig>
    ): Cypress.PluginConfigOptions;
}
