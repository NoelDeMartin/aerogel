import solidReset from './solid-reset';
import solidRequest from './solid-request';

export function addSolidTasks(on: Cypress.PluginEvents): void {
    on('task', { solidReset, solidRequest });
}
