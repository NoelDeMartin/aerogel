import resetSolid from './reset-solid';

export function addSolidTasks(on: Cypress.PluginEvents): void {
    on('task', { resetSolid });
}
