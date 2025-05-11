import * as a11yCommands from './a11y';
import * as appCommands from './app';
import * as errorsCommands from './errors';
import * as formsCommands from './forms';
import * as localFirstCommands from './local-first';
import * as soukaiCommands from './soukai';
import * as storageCommands from './storage';
import * as overrides from './overrides';
import { defineCommands } from './lib';

export * from './lib';

export const aerogelCommands = {
    ...a11yCommands,
    ...appCommands,
    ...errorsCommands,
    ...formsCommands,
    ...localFirstCommands,
    ...soukaiCommands,
    ...storageCommands,
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
