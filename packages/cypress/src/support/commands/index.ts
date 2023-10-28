import * as a11yCommands from './a11y';
import * as overrides from './overrides';
import * as solidCommands from './solid';
import * as soukaiCommands from './soukai';

export const commands = {
    ...a11yCommands,
    ...solidCommands,
    ...soukaiCommands,
};

export type CustomCommands = typeof commands;

export default function installCustomCommands(): void {
    for (const [name, implementation] of Object.entries(commands)) {
        Cypress.Commands.add(
            name as unknown as keyof Cypress.Chainable,
            implementation as Cypress.CommandFn<keyof Cypress.ChainableMethods>,
        );
    }

    for (const [name, implementation] of Object.entries(overrides)) {
        Cypress.Commands.overwrite(
            name as unknown as keyof Cypress.Chainable,
            implementation as unknown as Cypress.CommandFnWithOriginalFn<keyof Cypress.Chainable>,
        );
    }
}

declare global {
    namespace Cypress {
        interface Chainable extends CustomCommands {}
    }
}
