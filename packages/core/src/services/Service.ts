import { computed, reactive } from 'vue';
import { MagicObject, PromisedValue, Storage, isEmpty, objectDeepClone, objectOnly } from '@noeldemartin/utils';
import type { ComputedRef } from 'vue';
import type { Constructor } from '@noeldemartin/utils';

import ServiceBootError from '@/errors/ServiceBootError';

export type ServiceState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type DefaultServiceState = {};
export type ServiceConstructor<T extends Service = Service> = Constructor<T> & typeof Service;

export type ComputedStateDefinition<TState extends ServiceState, TComputedState extends ServiceState> = {
    [K in keyof TComputedState]: (state: TState) => TComputedState[K];
};

export function defineServiceState<
    State extends ServiceState = ServiceState,
    ComputedState extends ServiceState = {}
>(options: {
    initialState: State;
    persist?: (keyof State)[];
    computed?: ComputedStateDefinition<State, ComputedState>;
    serialize?: (state: Partial<State>) => Partial<State>;
}): Constructor<State> & Constructor<ComputedState> & ServiceConstructor {
    return class extends Service<State, ComputedState> {

        public static persist = (options.persist as string[]) ?? [];

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

    protected _namespace: string;
    private _booted: PromisedValue<void>;
    private _state: State;
    private _computedState: Record<keyof ComputedState, ComputedRef>;

    constructor() {
        super();

        this._namespace = new.target.name;
        this._booted = new PromisedValue();
        this._state = reactive(this.getInitialState());
        this._computedState = Object.entries(this.getComputedStateDefinition()).reduce(
            (computedState, [name, method]) => {
                computedState[name as keyof ComputedState] = computed(() => method(this._state, this));

                return computedState;
            },
            {} as Record<keyof ComputedState, ComputedRef>,
        );
    }

    public get booted(): PromisedValue<void> {
        return this._booted;
    }

    public launch(namespace?: string): Promise<void> {
        const handleError = (error: unknown) => this._booted.reject(new ServiceBootError(this._namespace, error));

        this._namespace = namespace ?? this._namespace;

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

        if (this.hasComputedState(property)) {
            return this.getComputedState(property);
        }

        return super.__get(property);
    }

    protected __set(property: string, value: unknown): void {
        this.setState({ [property]: value } as Partial<State>);
    }

    protected hasState<P extends keyof State>(property: P): boolean {
        return property in this._state;
    }

    protected hasComputedState<P extends keyof State>(property: P): boolean {
        return property in this._computedState;
    }

    protected getState(): State;
    protected getState<P extends keyof State>(property: P): State[P];
    protected getState<P extends keyof State>(property?: P): State | State[P] {
        return property ? this._state[property] : this._state;
    }

    protected getComputedState<P extends keyof ComputedState>(property: P): ComputedState[P] {
        return this._computedState[property]?.value;
    }

    protected setState(state: Partial<State>): void {
        Object.assign(this._state, state);

        this.onStateUpdated(state);
    }

    protected onStateUpdated(state: Partial<State>): void {
        // TODO fix this.static()
        const persist = (this.constructor as unknown as { persist: string[] }).persist;
        const persisted = objectOnly(state, persist);

        if (isEmpty(persisted)) {
            return;
        }

        const storage = Storage.require<ServiceStorage>(this._namespace);

        Storage.set(this._namespace, {
            ...storage,
            ...this.serializePersistedState(objectDeepClone(persisted) as Partial<State>),
        });
    }

    protected getPersistedState(): (keyof State)[] {
        return [];
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

        if (Storage.has(this._namespace)) {
            const persisted = Storage.require<ServiceStorage>(this._namespace);
            this.setState(persisted);

            return;
        }

        Storage.set(this._namespace, objectOnly(this.getState(), persist));
    }

}
