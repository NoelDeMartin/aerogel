import type { ClosureResult } from '@noeldemartin/utils';

import * as allyQueries from './a11y';

export const queries = {
    ...allyQueries,
};

export type CustomQueries<T = typeof queries> = {
    [K in keyof T]: T[K] extends (...args: infer TArgs) => ClosureResult
        ? (...args: TArgs) => Cypress.Chainable
        : never;
};

export default function installCustomQueries(): void {
    for (const [name, implementation] of Object.entries(queries)) {
        Cypress.Commands.addQuery(
            name as unknown as keyof Cypress.Chainable,
            implementation as Cypress.QueryFn<keyof Cypress.Chainable>,
        );
    }
}

declare global {
    namespace Cypress {
        interface Chainable extends CustomQueries {
            state(type: 'current'): Cypress.Command;
        }

        interface EnqueuedCommandAttributes {
            timeout: number;
        }
    }
}
