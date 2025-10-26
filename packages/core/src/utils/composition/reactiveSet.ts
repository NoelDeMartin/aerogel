import { fail } from '@noeldemartin/utils';
import { customRef } from 'vue';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function reactiveSet<T>(initial?: T[] | Set<T>, options: { equals?: (a: T, b: T) => boolean } = {}) {
    let set: Set<T> = new Set(initial);
    let trigger: () => void;
    let track: () => void;
    const equals = options?.equals;
    const hasEqual = equals
        ? (item: T) => ref.value.values().some((existingItem) => equals(item, existingItem))
        : () => false;
    const ref = customRef((_track, _trigger) => {
        track = _track;
        trigger = _trigger;

        return {
            get: () => set,
            set: () => fail('Attempted to write read-only reactive set'),
        };
    });

    return {
        values() {
            track();

            return Array.from(ref.value.values());
        },
        has(item: T) {
            track();

            return ref.value.has(item) || hasEqual(item);
        },
        add(item: T) {
            trigger();

            if (hasEqual(item)) {
                return;
            }

            ref.value.add(item);
        },
        delete(item: T) {
            trigger();

            ref.value.delete(item);
        },
        clear() {
            trigger();

            ref.value.clear();
        },
        reset(items?: T[] | Set<T>) {
            trigger();

            set = new Set(items);
        },
    };
}

export type ReactiveSet<T = unknown> = ReturnType<typeof reactiveSet<T>>;
