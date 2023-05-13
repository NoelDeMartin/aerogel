/// <reference types="cypress" />

import * as a11yCommands from './a11y';
import * as storageCommands from './storage';

const commands = {
    ...a11yCommands,
    ...storageCommands,
};

type CustomCommands = typeof commands;

declare global {
    namespace Cypress {
        interface Chainable extends CustomCommands {}
    }
}

export default function installCustomCommands(): void {
    beforeEach(() => {
        cy.resetStorage();
    });

    for (const [name, implementation] of Object.entries(commands)) {
        Cypress.Commands.add(
            name as unknown as keyof Cypress.Chainable,
            implementation as Cypress.CommandFn<keyof Cypress.ChainableMethods>,
        );
    }
}
