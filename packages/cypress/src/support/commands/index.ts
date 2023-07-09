import * as a11yCommands from './a11y';

export const commands = {
    ...a11yCommands,
};

export type CustomCommands = typeof commands;

export default function installCustomCommands(): void {
    for (const [name, implementation] of Object.entries(commands)) {
        Cypress.Commands.add(
            name as unknown as keyof Cypress.Chainable,
            implementation as Cypress.CommandFn<keyof Cypress.ChainableMethods>,
        );
    }
}

declare global {
    namespace Cypress {
        interface Chainable extends CustomCommands {}
    }
}
