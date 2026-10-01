import { fail } from '@noeldemartin/utils';
import { customRef } from 'vue';

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function reactiveSet<T>(initial?: T[] | Set<T>, options: { equals?: (a: T, b: T) => boolean } = {}) {
    let set: Set<T> = new Set(initial);
    let trigger: () => void;
    let track: () => void;
    const equals = options?.equals;
    const hasEqual = equals
        ? (item: T) => Array.from(ref.value.values()).some((existingItem) => equals(item, existingItem))
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
        values(): T[] {
            track();

            return Array.from(ref.value.values());
        },
        has(item: T): boolean {
            track();

            return ref.value.has(item) || hasEqual(item);
        },
        add(item: T): void {
            trigger();

            if (hasEqual(item)) {
                return;
            }

            ref.value.add(item);
        },
        delete(item: T): void {
            trigger();

            ref.value.delete(item);
        },
        clear(): void {
            trigger();

            ref.value.clear();
        },
        reset(items?: T[] | Set<T>): void {
            trigger();

            set = new Set(items);
        },
    };
}

export type ReactiveSet<T = unknown> = ReturnType<typeof reactiveSet<T>>;
