import { fail } from '@noeldemartin/utils';
import { customRef } from 'vue';

function createItemsMap<T>(values: T[] | Set<T>, getKey: (item: T) => unknown) {
    return new Map(Array.from(values).map((item) => [getKey(item), item]));
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function reactiveSet<T>(initial?: T[] | Set<T>, options: { key?: (item: T) => unknown } = {}) {
    const getKey = options.key ?? ((item: T) => item);

    let items = createItemsMap(initial ?? [], getKey);
    let trigger: () => void;
    let track: () => void;

    const ref = customRef((_track, _trigger) => {
        track = _track;
        trigger = _trigger;

        return {
            get: () => items,
            set: () => fail('Attempted to write read-only reactive set'),
        };
    });

    return {
        values(): T[] {
            track();

            return Array.from(ref.value.values());
        },
        has(item: T): boolean {
            track();

            return ref.value.has(getKey(item));
        },
        add(item: T): void {
            const key = getKey(item);

            trigger();

            if (ref.value.has(key)) {
                return;
            }

            ref.value.set(key, item);
        },
        delete(item: T): void {
            trigger();

            ref.value.delete(getKey(item));
        },
        clear(): void {
            trigger();

            ref.value.clear();
        },
        reset(newItems?: T[] | Set<T>): void {
            trigger();

            items = createItemsMap(newItems ?? [], getKey);
        },
    };
}

export type ReactiveSet<T = unknown> = ReturnType<typeof reactiveSet<T>>;
