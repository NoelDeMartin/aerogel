import * as a11yCommands from './a11y';
import * as appCommands from './app';
import * as soukaiCommands from './soukai';

import * as overrides from './overrides';

export const aerogelCommands = {
    ...a11yCommands,
    ...appCommands,
    ...soukaiCommands,
};

export type CustomAerogelCommands = typeof aerogelCommands;

export default function(): void {
    for (const [name, implementation] of Object.entries(aerogelCommands)) {
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
        interface Chainable extends CustomAerogelCommands {}
    }
}
