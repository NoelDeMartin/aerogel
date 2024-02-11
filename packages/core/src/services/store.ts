import { tap } from '@noeldemartin/utils';
import { createPinia, defineStore, setActivePinia } from 'pinia';
import type { DefineStoreOptions, Pinia, StateTree, Store, _GettersTree } from 'pinia';

let _store: Pinia | null = null;

function initializePiniaStore(): Pinia {
    return _store ?? resetPiniaStore();
}

export function resetPiniaStore(): Pinia {
    return tap(createPinia(), (store) => {
        _store = store;

        setActivePinia(store);
    });
}

export function getPiniaStore(): Pinia {
    return _store ?? initializePiniaStore();
}

export function defineServiceStore<Id extends string, S extends StateTree = {}, G extends _GettersTree<S> = {}, A = {}>(
    name: Id,
    options: Omit<DefineStoreOptions<Id, S, G, A>, 'id'>,
): Store<Id, S, G, A> {
    initializePiniaStore();

    return defineStore(name, options)();
}
