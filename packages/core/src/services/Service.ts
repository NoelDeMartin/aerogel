import {
    MagicObject,
    PromisedValue,
    Storage,
    arrayFrom,
    fail,
    isEmpty,
    objectDeepClone,
    objectOnly,
} from '@noeldemartin/utils';
import type { Constructor, Nullable } from '@noeldemartin/utils';
import type { Store } from 'pinia';

import ServiceBootError from '@/errors/ServiceBootError';
import { defineServiceStore } from '@/services/store';
import type { Unref } from '@/utils/vue';

export type ServiceState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type DefaultServiceState = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type ServiceConstructor<T extends Service = Service> = Constructor<T> & typeof Service;

export type ComputedStateDefinition<TState extends ServiceState, TComputedState extends ServiceState> = {
    [K in keyof TComputedState]: (state: Unref<TState>) => TComputedState[K];
} & ThisType<{
    readonly [K in keyof TComputedState]: TComputedState[K];
}>;

export type StateWatchers<TService extends Service, TState extends ServiceState> = {
    [K in keyof TState]?: (this: TService, value: TState[K], oldValue: TState[K]) => unknown;
};

export type ServiceWithState<
    State extends ServiceState = ServiceState,
    ComputedState extends ServiceState = {},
    ServiceStorage = Partial<State>
> = Constructor<Unref<State>> &
    Constructor<ComputedState> &
    Constructor<Service<Unref<State>, ComputedState, Unref<ServiceStorage>>>;

export function defineServiceState<
    State extends ServiceState = ServiceState,
    ComputedState extends ServiceState = {},
    ServiceStorage = Partial<State>
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

        public static persist = (options.persist as string[]) ?? [];

        protected usesStore(): boolean {
            return true;
        }

        protected getName(): string | null {
            return options.name ?? null;
        }

        protected getInitialState(): Unref<State> {
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
            }, {} as Unref<State>);
        }

        protected getComputedStateDefinition(): ComputedStateDefinition<Unref<State>, ComputedState> {
            return (options.computed ?? {}) as ComputedStateDefinition<Unref<State>, ComputedState>;
        }

        protected getStateWatchers(): StateWatchers<Service, Unref<State>> {
            return (options.watch ?? {}) as StateWatchers<Service, Unref<State>>;
        }

        protected serializePersistedState(state: Partial<State>): ServiceStorage {
            return options.serialize?.(state) ?? (state as ServiceStorage);
        }

        protected deserializePersistedState(state: ServiceStorage): Partial<State> {
            return options.restore?.(state) ?? (state as Partial<State>);
        }
    
    } as unknown as ServiceWithState<State, ComputedState, ServiceStorage>;
}

export default class Service<
    State extends ServiceState = DefaultServiceState,
    ComputedState extends ServiceState = {},
    ServiceStorage = Partial<State>
> extends MagicObject {

    public static persist: string[] = [];

    protected _name: string;
    private _booted: PromisedValue<void>;
    private _computedStateKeys: Set<keyof State>;
    private _watchers: StateWatchers<Service, State>;
    private _store: Store<string, State, ComputedState, {}> | false;

    constructor() {
        super();

        const getters = this.getComputedStateDefinition();

        this._name = this.getName() ?? new.target.name;
        this._booted = new PromisedValue();
        this._computedStateKeys = new Set(Object.keys(getters));
        this._watchers = this.getStateWatchers();
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

    public static<T extends typeof Service>(): T;
    public static<T extends typeof Service, K extends keyof T>(property: K): T[K];
    public static<T extends typeof Service, K extends keyof T>(property?: K): T | T[K] {
        return super.static<T, K>(property as K);
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

        const update = typeof stateOrProperty === 'string' ? { [stateOrProperty]: value } : stateOrProperty;
        const old = objectOnly(this._store.$state as State, Object.keys(update));

        Object.assign(this._store.$state, update);
        this.onStateUpdated(update as Partial<State>, old as Partial<State>);
    }

    public updatePersistedState<T extends keyof State>(key: T): void;
    public updatePersistedState<T extends keyof State>(keys: T[]): void;
    public updatePersistedState<T extends keyof State>(keyOrKeys: T | T[]): void {
        if (!this._store) {
            return;
        }

        const keys = arrayFrom(keyOrKeys) as Array<keyof State>;
        const state = objectOnly(this._store.$state as State, keys);

        if (isEmpty(state)) {
            return;
        }

        this.onPersistentStateUpdated(state);
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

    protected onStateUpdated(update: Partial<State>, old: Partial<State>): void {
        const persisted = objectOnly(update, this.static('persist'));

        if (!isEmpty(persisted)) {
            this.onPersistentStateUpdated(persisted as Partial<State>);
        }

        for (const property in update) {
            const watcher = this._watchers[property] as Nullable<(value: unknown, oldValue: unknown) => unknown>;

            if (!watcher || update[property] === old[property]) {
                continue;
            }

            watcher.call(this, update[property], old[property]);
        }
    }

    protected onPersistentStateUpdated(persisted: Partial<State>): void {
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

    protected getStateWatchers(): StateWatchers<Service, State> {
        return {};
    }

    protected serializePersistedState(state: Partial<State>): ServiceStorage {
        return state as ServiceStorage;
    }

    protected deserializePersistedState(state: ServiceStorage): Partial<State> {
        return state as Partial<State>;
    }

    protected async frameworkBoot(): Promise<void> {
        this.restorePersistedState();
    }

    protected async boot(): Promise<void> {
        // Placeholder for overrides, don't place any functionality here.
    }

    protected restorePersistedState(): void {
        if (!this.usesStore() || isEmpty(this.static('persist'))) {
            return;
        }

        if (Storage.has(this._name)) {
            const persisted = Storage.require<ServiceStorage>(this._name);
            this.setState(this.deserializePersistedState(persisted));

            return;
        }

        Storage.set(this._name, objectOnly(this.getState(), this.static('persist')));
    }

    protected requireStore(): Store<string, State, ComputedState, {}> {
        if (!this._store) {
            return fail(`Failed getting '${this._name}' store`);
        }

        return this._store;
    }

}
