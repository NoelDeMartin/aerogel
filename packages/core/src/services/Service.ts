import { MagicObject, PromisedValue, Storage, fail, isEmpty, objectDeepClone, objectOnly } from '@noeldemartin/utils';
import type { Constructor } from '@noeldemartin/utils';
import type { MaybeRef } from 'vue';
import type { Store } from 'pinia';

import ServiceBootError from '@/errors/ServiceBootError';
import { defineServiceStore } from '@/services/store';

export type ServiceState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type DefaultServiceState = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type ServiceConstructor<T extends Service = Service> = Constructor<T> & typeof Service;
export type UnrefServiceState<State extends ServiceState> = {
    [K in keyof State]: State[K] extends MaybeRef<infer T> ? T : State[K];
};

export type ComputedStateDefinition<TState extends ServiceState, TComputedState extends ServiceState> = {
    [K in keyof TComputedState]: (state: UnrefServiceState<TState>) => TComputedState[K];
} & ThisType<{
    readonly [K in keyof TComputedState]: TComputedState[K];
}>;

export function defineServiceState<
    State extends ServiceState = ServiceState,
    ComputedState extends ServiceState = {}
>(options: {
    name: string;
    initialState: State | (() => State);
    persist?: (keyof State)[];
    computed?: ComputedStateDefinition<State, ComputedState>;
    serialize?: (state: Partial<State>) => Partial<State>;
}): Constructor<UnrefServiceState<State>> &
    Constructor<ComputedState> &
    Constructor<Service<UnrefServiceState<State>, ComputedState, Partial<UnrefServiceState<State>>>> {
    return class extends Service<UnrefServiceState<State>, ComputedState> {

        public static persist = (options.persist as string[]) ?? [];

        protected usesStore(): boolean {
            return true;
        }

        protected getName(): string | null {
            return options.name ?? null;
        }

        protected getInitialState(): UnrefServiceState<State> {
            if (typeof options.initialState === 'function') {
                return options.initialState();
            }

            return Object.entries(options.initialState).reduce((state, [key, value]) => {
                try {
                    value = structuredClone(value);
                } catch (error) {
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
            }, {} as UnrefServiceState<State>);
        }

        protected getComputedStateDefinition(): ComputedStateDefinition<UnrefServiceState<State>, ComputedState> {
            return (options.computed ?? {}) as ComputedStateDefinition<UnrefServiceState<State>, ComputedState>;
        }

        protected serializePersistedState(state: Partial<State>): Partial<State> {
            return options.serialize?.(state) ?? state;
        }

    } as unknown as Constructor<UnrefServiceState<State>> &
        Constructor<ComputedState> &
        Constructor<Service<UnrefServiceState<State>, ComputedState, Partial<UnrefServiceState<State>>>>;
}

export default class Service<
    State extends ServiceState = DefaultServiceState,
    ComputedState extends ServiceState = {},
    ServiceStorage extends Partial<State> = Partial<State>
> extends MagicObject {

    public static persist: string[] = [];

    protected _name: string;
    private _booted: PromisedValue<void>;
    private _computedStateKeys: Set<keyof State>;
    private _store: Store<string, State, ComputedState, {}> | false;

    constructor() {
        super();

        const getters = this.getComputedStateDefinition();

        this._name = this.getName() ?? new.target.name;
        this._booted = new PromisedValue();
        this._computedStateKeys = new Set(Object.keys(getters));
        this._store =
            this.usesStore() &&
            defineServiceStore(this._name, {
                state: () => this.getInitialState(),

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getters: getters as any,
            });
    }

    public get booted(): PromisedValue<void> {
        return this._booted;
    }

    public launch(): Promise<void> {
        const handleError = (error: unknown) => this._booted.reject(new ServiceBootError(this._name, error));

        try {
            this.frameworkBoot()
                .then(() => this.boot())
                .then(() => this._booted.resolve())
                .catch(handleError);
        } catch (error) {
            handleError(error);
        }

        return this._booted;
    }

    public hasPersistedState(): boolean {
        return Storage.has(this._name);
    }

    public hasState<P extends keyof State>(property: P): boolean {
        if (!this._store) {
            return false;
        }

        return property in this._store.$state || this._computedStateKeys.has(property);
    }

    public getState(): State;
    public getState<P extends keyof State>(property: P): State[P];
    public getState<P extends keyof State>(property?: P): State | State[P] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = this._store as any;

        if (property) {
            return store ? store[property] : undefined;
        }

        return store ? store : {};
    }

    public setState<P extends keyof State>(property: P, value: State[P]): void;
    public setState(state: Partial<State>): void;
    public setState<P extends keyof State>(stateOrProperty: P | Partial<State>, value?: State[P]): void {
        if (!this._store) {
            return;
        }

        const state = (
            typeof stateOrProperty === 'string' ? { [stateOrProperty]: value } : stateOrProperty
        ) as Partial<State>;

        Object.assign(this._store.$state, state);

        this.onStateUpdated(state);
    }

    protected __get(property: string): unknown {
        if (this.hasState(property)) {
            return this.getState(property);
        }

        return super.__get(property);
    }

    protected __set(property: string, value: unknown): void {
        this.setState({ [property]: value } as Partial<State>);
    }

    protected onStateUpdated(state: Partial<State>): void {
        // TODO fix this.static()
        const persist = (this.constructor as unknown as { persist: string[] }).persist;
        const persisted = objectOnly(state, persist);

        if (isEmpty(persisted)) {
            return;
        }

        const storage = Storage.get<ServiceStorage>(this._name);

        if (!storage) {
            return;
        }

        Storage.set(this._name, {
            ...storage,
            ...this.serializePersistedState(objectDeepClone(persisted) as Partial<State>),
        });
    }

    protected usesStore(): boolean {
        return false;
    }

    protected getName(): string | null {
        return null;
    }

    protected getInitialState(): State {
        return {} as State;
    }

    protected getComputedStateDefinition(): ComputedStateDefinition<State, ComputedState> {
        return {} as ComputedStateDefinition<State, ComputedState>;
    }

    protected serializePersistedState(state: Partial<State>): Partial<State> {
        return state;
    }

    protected async frameworkBoot(): Promise<void> {
        this.initializePersistedState();
    }

    protected async boot(): Promise<void> {
        // Placeholder for overrides, don't place any functionality here.
    }

    protected initializePersistedState(): void {
        // TODO fix this.static()
        const persist = (this.constructor as unknown as { persist: string[] }).persist;

        if (!this.usesStore() || isEmpty(persist)) {
            return;
        }

        if (Storage.has(this._name)) {
            const persisted = Storage.require<ServiceStorage>(this._name);
            this.setState(persisted);

            return;
        }

        Storage.set(this._name, objectOnly(this.getState(), persist));
    }

    protected requireStore(): Store<string, State, ComputedState, {}> {
        if (!this._store) {
            return fail(`Failed getting '${this._name}' store`);
        }

        return this._store;
    }

}
