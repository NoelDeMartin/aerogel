import { MagicObject, PromisedValue } from '@noeldemartin/utils';
import { reactive } from 'vue';
import type { Constructor } from '@noeldemartin/utils';

import ServiceBootError from '@/errors/ServiceBootError';

export type ServiceState = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type DefaultServiceState = {};
export type ServiceConstructor<T extends Service = Service> = Constructor<T> & typeof Service;

export function defineServiceState<State extends ServiceState>(options: {
    initialState: State;
}): Constructor<State> & ServiceConstructor {
    return class extends Service<State> {

        protected getInitialState(): State {
            return options.initialState;
        }
    
    } as unknown as Constructor<State> & ServiceConstructor;
}

export default class Service<State extends ServiceState = DefaultServiceState> extends MagicObject {

    protected _namespace: string;
    private _booted: PromisedValue<void>;
    private _state: State;

    constructor() {
        super();

        this._namespace = new.target.name;
        this._booted = new PromisedValue();
        this._state = reactive(this.getInitialState());
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
        if (!this.hasState(property)) {
            return super.__get(property);
        }

        return this.getState(property);
    }

    protected __set(property: string, value: unknown): void {
        this.setState({ [property]: value } as Partial<State>);
    }

    protected hasState<P extends keyof State>(property: P): boolean {
        return property in this._state;
    }

    protected getState(): State;
    protected getState<P extends keyof State>(property: P): State[P];
    protected getState<P extends keyof State>(property?: P): State | State[P] {
        return property ? this._state[property] : this._state;
    }

    protected setState(state: Partial<State>): void {
        Object.assign(this._state, state);
    }

    protected getInitialState(): State {
        return {} as State;
    }

    protected async boot(): Promise<void> {
        //
    }

}
