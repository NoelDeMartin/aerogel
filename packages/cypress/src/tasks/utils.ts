import type { Closure, ClosureArgs } from '@noeldemartin/utils';

export function log(...messages: [string, ...unknown[]]): void {
    const [firstMessage, ...otherMessages] = messages;

    // eslint-disable-next-line no-console
    console.log(`[Aerogel]: ${firstMessage}`, ...otherMessages);
}

export function defineTask<TArgs extends ClosureArgs>(
    task: Closure<TArgs, unknown>,
): Closure<[TArgs], Promise<unknown>> {
    return async (args) => {
        const result = await task(...(args ?? []));

        return result ?? null;
    };
}
