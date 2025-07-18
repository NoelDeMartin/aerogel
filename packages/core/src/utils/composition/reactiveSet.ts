import { fail } from '@noeldemartin/utils';
import { customRef } from 'vue';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function reactiveSet<T>(initial?: T[] | Set<T>) {
    let set: Set<T> = new Set(initial);
    let trigger: () => void;
    let track: () => void;
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

            return ref.value.has(item);
        },
        add(item: T) {
            trigger();

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
