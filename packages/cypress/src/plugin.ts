import { addMatchImageSnapshotPlugin } from '@simonsmith/cypress-image-snapshot/plugin';

export default function install(on: Cypress.PluginEvents): void {
    addMatchImageSnapshotPlugin(on);
}
