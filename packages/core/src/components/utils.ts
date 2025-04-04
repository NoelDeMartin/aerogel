import clsx from 'clsx';
import { computed, customRef, unref } from 'vue';
import { cva } from 'class-variance-authority';
import { isObject } from '@noeldemartin/utils';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';
import type { ComputedRef, ExtractPropTypes, PropType, Ref, UnwrapNestedRefs } from 'vue';
import type { GetClosureArgs, GetClosureResult } from '@noeldemartin/utils';

import type { HasElement } from '@aerogel/core/components/contracts/shared';

export type CVAConfig<T> = NonNullable<GetClosureArgs<typeof cva<T>>[1]>;
export type CVAProps<T> = NonNullable<GetClosureArgs<GetClosureResult<typeof cva<T>>>[0]>;
export type RefsObject<T> = { [K in keyof T]: Ref<T[K]> | T[K] };
export type Variants<T extends Record<string, string>> = Required<{
    [K in keyof T]: {
        [key in T[K]]: string;
    };
}>;

export type ComponentPropDefinitions<T> = {
    [K in keyof T]: {
        type?: PropType<T[K]>;
        default: T[K] | (() => T[K]) | null;
    };
};

export type PickComponentProps<TValues, TDefinitions> = {
    [K in keyof TValues]: K extends keyof TDefinitions ? TValues[K] : never;
};

export function computedVariantClasses<T>(
    value: RefsObject<{ baseClasses?: string } & CVAProps<T>>,
    config: { baseClasses?: string } & CVAConfig<T>,
): ComputedRef<string> {
    return computed(() => {
        const { baseClasses: valueBaseClasses, ...valueRefs } = value;
        const { baseClasses: configBaseClasses, ...configs } = config;
        const variants = cva(configBaseClasses, configs as CVAConfig<T>);
        const values = Object.entries(valueRefs).reduce((extractedValues, [name, valueRef]) => {
            extractedValues[name as keyof CVAProps<T>] = unref(valueRef);

            return extractedValues;
        }, {} as CVAProps<T>);

        return classes(variants(values), unref(valueBaseClasses));
    });
}

export function classes(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

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
