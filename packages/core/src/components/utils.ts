import { isObject } from '@noeldemartin/utils';
import { customRef } from 'vue';
import type { ExtractPropTypes, PropType, Ref, UnwrapNestedRefs } from 'vue';

import type { HasElement } from '@aerogel/core/components/contracts/shared';

export type ComponentPropDefinitions<T> = {
    [K in keyof T]: {
        type?: PropType<T[K]>;
        default: T[K] | (() => T[K]) | null;
    };
};

export type PickComponentProps<TValues, TDefinitions> = {
    [K in keyof TValues]: K extends keyof TDefinitions ? TValues[K] : never;
};

export function elementRef(): Ref<HTMLElement | undefined> {
    return customRef((track, trigger) => {
        let value: HTMLElement | undefined = undefined;

        return {
            get() {
                track();

                return value;
            },
            set(newValue) {
                value = getElement(newValue);

                trigger();
            },
        };
    });
}

export function extractComponentProps<TDefinitions extends {}, TValues extends ExtractPropTypes<TDefinitions>>(
    values: TValues,
    definitions: TDefinitions,
): PickComponentProps<TValues, TDefinitions> {
    return Object.keys(definitions).reduce(
        (extracted, prop) => {
            extracted[prop] = values[prop as keyof TValues];

            return extracted;
        },
        {} as Record<string, unknown>,
    ) as PickComponentProps<TValues, TDefinitions>;
}

export function getElement(value: unknown): HTMLElement | undefined {
    if (value instanceof HTMLElement) {
        return value;
    }

    if (hasElement(value)) {
        return value.$el;
    }
}

export function hasElement(value: unknown): value is UnwrapNestedRefs<HasElement> {
    return isObject(value) && '$el' in value;
}
