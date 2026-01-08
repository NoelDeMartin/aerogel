import { setupSolidNodeEvents } from 'cypress-solid/config';
import { addMatchImageSnapshotPlugin } from '@simonsmith/cypress-image-snapshot/plugin.js';
import type { CypressSolidConfig } from 'cypress-solid';

export function setupAerogelNodeEvents(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions,
    solidConfig: Partial<CypressSolidConfig> = {},
): Cypress.PluginConfigOptions {
    setupSolidNodeEvents(on, config, solidConfig);
    addMatchImageSnapshotPlugin(on);

    return config;
}
