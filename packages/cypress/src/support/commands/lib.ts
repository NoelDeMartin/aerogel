import type { Closure } from '@noeldemartin/utils';

export type CommandOverride<T = unknown> = T extends Closure<infer TArgs, infer TResult>
    ? (original: T, ...args: TArgs) => TResult
    : never;

export function defineOverride<T>(override: CommandOverride<T>): CommandOverride<T> {
    return override;
}

export function defineCommands(commands: Record<string, Function>, overrides: Record<string, Function> = {}): void {
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
