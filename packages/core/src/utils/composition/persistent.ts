import { reactive, toRaw, watch } from 'vue';
import { Storage } from '@noeldemartin/utils';
import type { UnwrapNestedRefs } from 'vue';

export function persistent<T extends object>(name: string, defaults: T): UnwrapNestedRefs<T> {
    const store = reactive<T>(Storage.get<T>(name) ?? defaults);

    watch(store, () => Storage.set(name, toRaw(store)));

    return store;
}
