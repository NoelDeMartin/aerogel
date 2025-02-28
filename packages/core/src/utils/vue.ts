import { fail } from '@noeldemartin/utils';
import { computed, inject, reactive, ref, watch } from 'vue';
import type { Directive, InjectionKey, MaybeRef, PropType, Ref, UnwrapNestedRefs } from 'vue';

type BaseProp<T> = {
    type?: PropType<T>;
    validator?(value: unknown): boolean;
};

type RequiredProp<T> = BaseProp<T> & { required: true };
type OptionalProp<T> = BaseProp<T> & { default: T | (() => T) | null };

export type AcceptRefs<T> = { [K in keyof T]: T[K] | RefUnion<T[K]> };
export type ComponentProps = Record<string, unknown>;
export type RefUnion<T> = T extends infer R ? Ref<R> : never;
export type Unref<T> = { [K in keyof T]: T[K] extends MaybeRef<infer Value> ? Value : T[K] };

export function arrayProp<T>(defaultValue?: () => T[]): OptionalProp<T[]> {
    return {
        type: Array as PropType<T[]>,
        default: defaultValue ?? (() => []),
    };
}

export function booleanProp(defaultValue: boolean = false): OptionalProp<boolean> {
    return {
        type: Boolean,
        default: defaultValue,
    };
}

export function componentRef<T>(): Ref<UnwrapNestedRefs<T> | undefined> {
    return ref<UnwrapNestedRefs<T>>();
}

export function computedAsync<T>(getter: () => Promise<T>): Ref<T | undefined> {
    const result = ref<T>();
    const asyncValue = computed(getter);

    watch(asyncValue, async () => (result.value = await asyncValue.value), { immediate: true });

    return result;
}

export function defineDirective(directive: Directive): Directive {
    return directive;
}

export function enumProp<Enum extends Record<string, unknown>>(
    enumeration: Enum,
    defaultValue?: Enum[keyof Enum],
): OptionalProp<Enum[keyof Enum]> {
    const values = Object.values(enumeration) as Enum[keyof Enum][];

    return {
        type: String as unknown as PropType<Enum[keyof Enum]>,
        default: defaultValue ?? values[0] ?? null,
        validator: (value) => values.includes(value as Enum[keyof Enum]),
    };
}

export function injectReactive<T extends object>(key: InjectionKey<T> | string): UnwrapNestedRefs<T> | undefined {
    const value = inject(key);

    return value ? reactive<T>(value) : undefined;
}

export function injectReactiveOrFail<T extends object>(
    key: InjectionKey<T> | string,
    errorMessage?: string,
): UnwrapNestedRefs<T> {
    return injectReactive(key) ?? fail(errorMessage ?? `Could not resolve '${key}' injection key`);
}

export function injectOrFail<T>(key: InjectionKey<T> | string, errorMessage?: string): T {
    return inject(key) ?? fail(errorMessage ?? `Could not resolve '${key}' injection key`);
}

export function listenerProp<T extends Function = Function>(): OptionalProp<T | null> {
    return {
        type: Function as PropType<T>,
        default: null,
    };
}

export function mixedProp<T>(type?: PropType<T>): OptionalProp<T | null>;
export function mixedProp<T>(type: PropType<T>, defaultValue: T): OptionalProp<T>;
export function mixedProp<T>(type?: PropType<T>, defaultValue?: T): OptionalProp<T | null> {
    return {
        type,
        default: defaultValue ?? null,
    };
}

export function numberProp(): OptionalProp<number | null>;
export function numberProp(defaultValue: number): OptionalProp<number>;
export function numberProp(defaultValue: number | null = null): OptionalProp<number | null> {
    return {
        type: Number,
        default: defaultValue,
    };
}

export function objectProp<T = Object>(): OptionalProp<T | null>;
export function objectProp<T>(defaultValue: () => T): OptionalProp<T>;
export function objectProp<T = Object>(defaultValue: (() => T) | null = null): OptionalProp<T | null> {
    return {
        type: Object,
        default: defaultValue,
    };
}

export function requiredArrayProp<T>(): RequiredProp<T[]> {
    return {
        type: Array as PropType<T[]>,
        required: true,
    };
}

export function requiredEnumProp<Enum extends Record<string, unknown>>(
    enumeration: Enum,
): RequiredProp<Enum[keyof Enum]> {
    const values = Object.values(enumeration);

    return {
        type: String as unknown as PropType<Enum[keyof Enum]>,
        required: true,
        validator: (value) => values.includes(value),
    };
}

export function requiredMixedProp<T>(type?: PropType<T>): RequiredProp<T> {
    return {
        type,
        required: true,
    };
}

export function requiredNumberProp(): RequiredProp<number> {
    return {
        type: Number,
        required: true,
    };
}

export function requiredObjectProp<T = Object>(): RequiredProp<T> {
    return {
        type: Object,
        required: true,
    };
}

export function requiredStringProp(): RequiredProp<string> {
    return {
        type: String,
        required: true,
    };
}

export function stringProp(): OptionalProp<string | null>;
export function stringProp(defaultValue: string): OptionalProp<string>;
export function stringProp(defaultValue: string | null = null): OptionalProp<string | null> {
    return {
        type: String,
        default: defaultValue,
    };
}
