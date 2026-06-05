import { objectOnly } from '@noeldemartin/utils';

import type { Unref } from '@aerogel/core/utils';

import Service from './Service';
import type { ComputedStateDefinition, ServiceState, ServiceWithState, StateWatchers } from './Service';

export type Replace<
    TOriginal extends Record<string, unknown>,
    TReplacements extends Partial<Record<keyof TOriginal, unknown>>,
> = {
    [K in keyof TOriginal]: TReplacements extends Record<K, infer Replacement> ? Replacement : TOriginal[K];
};

export function defineServiceState<
    State extends ServiceState = ServiceState,
    ComputedState extends ServiceState = {},
    ServiceStorage = Partial<State>,
>(options: {
    name: string;
    initialState: State | (() => State);
    persist?: (keyof State)[];
    watch?: StateWatchers<Service, State>;
    computed?: ComputedStateDefinition<State, ComputedState>;
    serialize?: (state: Partial<State>) => ServiceStorage;
    restore?: (state: ServiceStorage) => Partial<State>;
}): ServiceWithState<State, ComputedState, ServiceStorage> {
    return class extends Service<Unref<State>, ComputedState, ServiceStorage> {

        public static override persist = (options.persist as string[]) ?? [];

        protected override usesStore(): boolean {
            return true;
        }

        protected override getName(): string | null {
            return options.name ?? null;
        }

        protected override getInitialState(): Unref<State> {
            if (typeof options.initialState === 'function') {
                return options.initialState();
            }

            return Object.entries(options.initialState).reduce((state, [key, value]) => {
                try {
                    value = structuredClone(value);
                } catch {
                    // eslint-disable-next-line no-console
                    console.warn(
                        `Could not clone '${key}' state from ${this.getName()} service, ` +
                            'this may cause problems if you\'re using multiple instances of the service ' +
                            '(for example, in unit tests).\n' +
                            'To fix this problem, declare your initialState as a function instead.',
                    );
                }

                state[key as keyof State] = value;

                return state;
            }, {} as Unref<State>);
        }

        protected override getComputedStateDefinition(): ComputedStateDefinition<Unref<State>, ComputedState> {
            return (options.computed ?? {}) as ComputedStateDefinition<Unref<State>, ComputedState>;
        }

        protected override getStateWatchers(): StateWatchers<Service, Unref<State>> {
            return (options.watch ?? {}) as StateWatchers<Service, Unref<State>>;
        }

        protected override serializePersistedState(state: Partial<State>): ServiceStorage {
            return options.serialize?.(state) ?? (state as ServiceStorage);
        }

        protected override deserializePersistedState(state: ServiceStorage): Partial<State> {
            return options.restore?.(state) ?? (state as Partial<State>);
        }

    } as unknown as ServiceWithState<State, ComputedState, ServiceStorage>;
}


export function replaceExisting<
    TOriginal extends Record<string, unknown>,
    TReplacements extends Partial<Record<keyof TOriginal, unknown>>,
>(original: TOriginal, replacements: TReplacements): Replace<TOriginal, TReplacements> {
    return {
        ...original,
        ...objectOnly(replacements, Object.keys(original)),
    } as Replace<TOriginal, TReplacements>;
}
