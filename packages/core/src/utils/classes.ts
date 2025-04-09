import clsx from 'clsx';
import { computed, unref } from 'vue';
import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'clsx';
import type { ComputedRef, PropType, Ref } from 'vue';
import type { GetClosureArgs, GetClosureResult } from '@noeldemartin/utils';

export type CVAConfig<T> = NonNullable<GetClosureArgs<typeof cva<T>>[1]>;
export type CVAProps<T> = NonNullable<GetClosureArgs<GetClosureResult<typeof cva<T>>>[0]>;
export type RefsObject<T> = { [K in keyof T]: Ref<T[K]> | T[K] };
export type Variants<T extends Record<string, string | boolean>> = Required<{
    [K in keyof T]: Exclude<T[K], undefined> extends string
        ? { [key in Exclude<T[K], undefined>]: string | null }
        : { true: string | null; false: string | null };
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
