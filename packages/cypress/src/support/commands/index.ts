import * as a11yCommands from './a11y';
import * as appCommands from './app';
import * as soukaiCommands from './soukai';
import * as overrides from './overrides';
import { defineCommands } from './lib';

export * from './lib';

export const aerogelCommands = {
    ...a11yCommands,
    ...appCommands,
    ...soukaiCommands,
};

export type AerogelCommands = typeof aerogelCommands;

export default function(): void {
    defineCommands(aerogelCommands, overrides);
}

declare global {
    namespace Cypress {
        interface Chainable extends AerogelCommands {}
    }
}
