import type { Closure } from '@noeldemartin/utils';
import type { DiffSnapshotResult } from '@simonsmith/cypress-image-snapshot/types';

type CommandOverride<T> = T extends Closure<infer TArgs, infer TResult>
    ? (original: T, ...args: TArgs) => TResult
    : never;

function defineOverride<T>(override: CommandOverride<T>): CommandOverride<T> {
    return override;
}

export const matchImageSnapshot = defineOverride<Cypress.Chainable['matchImageSnapshot']>((original, ...args) => {
    if (Cypress.env('SNAPSHOTS')) {
        return original(...args);
    }

    Cypress.log({ message: 'Snapshots disabled, set CYPRESS_SNAPSHOTS to enable' });

    return cy.wrap({ pass: true } as DiffSnapshotResult, { log: false });
});
