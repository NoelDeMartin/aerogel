import { arrayRemove, isPromiseLike } from '@noeldemartin/utils';
import { bootCoreModels, bootModelsFromViteGlob, setAsyncContextManager, setEngine, setNamespace } from 'soukai-bis';
import type { AsyncContextManager, Engine } from 'soukai-bis';

export type ModelsGlob = Record<string, Record<string, unknown>>;

// FIXME Replace with a proper implementation once browsers support async context propagation (e.g. AsyncContext).
// Until then, values are kept in a global stack and getValue() returns the most recent one still running. This
// means that while an async operation is pending, its value leaks to any other code running at the same time,
// including code that was never wrapped with runWithValue() (e.g. a long-running runWithEngine() would make
// unrelated getEngine() calls return its engine instead of the default one).
export function createGlobalAsyncContextManager<T>(): AsyncContextManager<T> {
    const contexts: { value: T }[] = [];

    return {
        runWithValue(value, operation) {
            const context = { value };

            contexts.push(context);

            try {
                const result = operation();

                if (isPromiseLike(result)) {
                    return Promise.resolve(result).finally(() =>
                        arrayRemove(contexts, context),
                    ) as unknown as typeof result;
                }

                arrayRemove(contexts, context);

                return result;
            } catch (error) {
                arrayRemove(contexts, context);

                throw error;
            }
        },
        getValue() {
            return contexts.at(-1)?.value;
        },
    };
}

export function bootModels(models: ModelsGlob = {}): void {
    bootCoreModels({ reset: true });
    bootModelsFromViteGlob(models, { reset: true });
}

export function setupAsyncContext(): void {
    setAsyncContextManager(createGlobalAsyncContextManager<Engine>());
}

export function setupSoukai(options: { engine: Engine; namespace: string; models?: ModelsGlob }): void {
    setEngine(options.engine);
    setNamespace(options.namespace);
    setupAsyncContext();
    bootModels(options.models);
}
