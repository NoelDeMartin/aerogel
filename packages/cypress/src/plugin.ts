import { addMatchImageSnapshotPlugin } from '@simonsmith/cypress-image-snapshot/plugin';

import { addSolidTasks } from './tasks';

export default function install(on: Cypress.PluginEvents): void {
    addMatchImageSnapshotPlugin(on);
    addSolidTasks(on);
}
