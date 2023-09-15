import { MagicObject, PromisedValue, Storage, isEmpty, objectDeepClone, objectOnly } from '@noeldemartin/utils';
import type { Constructor } from '@noeldemartin/utils';
import type { Store } from 'pinia';

import ServiceBootError from '@/errors/ServiceBootError';
import { defineServiceStore } from '@/services/store';

export type ServiceState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type DefaultServiceState = {};
export type ServiceConstructor<T extends Service = Service> = Constructor<T> & typeof Service;

export type ComputedStateDefinition<TState extends ServiceState, TComputedState extends ServiceState> = {
    [K in keyof TComputedState]: (state: TState) => TComputedState[K];
} & ThisType<{
    readonly [K in keyof TComputedState]: TComputedState[K];
}>;

export function defineServiceState<
    State extends ServiceState = ServiceState,
    ComputedState extends ServiceState = {}
>(options: {
    name: string;
    initialState: State;
    persist?: (keyof State)[];
    computed?: ComputedStateDefinition<State, ComputedState>;
    serialize?: (state: Partial<State>) => Partial<State>;
}): Constructor<State> & Constructor<ComputedState> & ServiceConstructor {
    return class extends Service<State, ComputedState> {

        public static persist = (options.persist as string[]) ?? [];

        protected usesStore(): boolean {
            return true;
        }

        protected getName(): string | null {
            return options.name ?? null;
        }

        protected getInitialState(): State {
            return options.initialState;
        }

        protected getComputedStateDefinition(): ComputedStateDefinition<State, ComputedState> {
            return options.computed ?? ({} as ComputedStateDefinition<State, ComputedState>);
        }

        protected serializePersistedState(state: Partial<State>): Partial<State> {
            return options.serialize?.(state) ?? state;
        }
    
    } as unknown as Constructor<State> & Constructor<ComputedState> & ServiceConstructor;
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
    private _store?: Store | false;

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
            this.boot()
                .then(() => this._booted.resolve())
                .catch(handleError);
        } catch (error) {
            handleError(error);
        }

        return this._booted;
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

    protected hasState<P extends keyof State>(property: P): boolean {
        if (!this._store) {
            return false;
        }

        return property in this._store.$state || this._computedStateKeys.has(property);
    }

    protected getState(): State;
    protected getState<P extends keyof State>(property: P): State[P];
    protected getState<P extends keyof State>(property?: P): State | State[P] {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = this._store as any;

        return store ? store[property] : undefined;
    }

    protected setState(state: Partial<State>): void {
        if (!this._store) {
            return;
        }

        Object.assign(this._store.$state, state);

        this.onStateUpdated(state);
    }

    protected onStateUpdated(state: Partial<State>): void {
        // TODO fix this.static()
        const persist = (this.constructor as unknown as { persist: string[] }).persist;
        const persisted = objectOnly(state, persist);

        if (isEmpty(persisted)) {
            return;
        }

        const storage = Storage.require<ServiceStorage>(this._name);

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

    protected async boot(): Promise<void> {
        this.restorePersistedState();
    }

    protected restorePersistedState(): void {
        // TODO fix this.static()
        const persist = (this.constructor as unknown as { persist: string[] }).persist;

        if (isEmpty(persist)) {
            return;
        }

        if (Storage.has(this._name)) {
            const persisted = Storage.require<ServiceStorage>(this._name);
            this.setState(persisted);

            return;
        }

        Storage.set(this._name, objectOnly(this.getState(), persist));
    }

}
