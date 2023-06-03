import type { PropType } from 'vue';

type Prop<T> = {
    type: PropType<T>;
    validator?(value: unknown): boolean;
} & ({ required: true } | { default: T | (() => T) | null });

export function arrayProp<T>(defaultValue?: () => T[]): Prop<T[]> {
    return {
        type: Array as PropType<T[]>,
        default: defaultValue ?? (() => []),
    };
}

export function booleanProp(defaultValue: boolean = false): Prop<boolean> {
    return {
        type: Boolean,
        default: defaultValue,
    };
}

export function enumProp<Enum extends Record<string, unknown>>(
    enumeration: Enum,
    defaultValue?: Enum[keyof Enum],
): Prop<Enum[keyof Enum]> {
    const values = Object.values(enumeration) as Enum[keyof Enum][];

    return {
        type: String as unknown as PropType<Enum[keyof Enum]>,
        default: defaultValue ?? values[0] ?? null,
        validator: (value) => values.includes(value as Enum[keyof Enum]),
    };
}

export function mixedProp<T>(type: PropType<T>): Prop<T | null> {
    return {
        type,
        default: null,
    };
}

export function numberProp(): Prop<number | null>;
export function numberProp(defaultValue: number): Prop<number>;
export function numberProp(defaultValue: number | null = null): Prop<number | null> {
    return {
        type: Number,
        default: defaultValue,
    };
}

export function objectProp<T = Object>(): Prop<T | null>;
export function objectProp<T>(defaultValue: () => T): Prop<T>;
export function objectProp<T = Object>(defaultValue: (() => T) | null = null): Prop<T | null> {
    return {
        type: Object,
        default: defaultValue,
    };
}

export function requiredArrayProp<T>(): Prop<T[]> {
    return {
        type: Array as PropType<T[]>,
        required: true,
    };
}

export function requiredEnumProp<Enum extends Record<string, unknown>>(enumeration: Enum): Prop<Enum[keyof Enum]> {
    const values = Object.values(enumeration);

    return {
        type: String as unknown as PropType<Enum[keyof Enum]>,
        required: true,
        validator: (value) => values.includes(value),
    };
}

export function requiredMixedProp<T>(type: PropType<T>): Prop<T> {
    return {
        type,
        required: true,
    };
}

export function requiredNumberProp(): Prop<number> {
    return {
        type: Number,
        required: true,
    };
}

export function requiredObjectProp<T = Object>(): Prop<T> {
    return {
        type: Object,
        required: true,
    };
}

export function requiredStringProp(): Prop<string> {
    return {
        type: String,
        required: true,
    };
}

export function stringProp(): Prop<string | null>;
export function stringProp(defaultValue: string): Prop<string>;
export function stringProp(defaultValue: string | null = null): Prop<string | null> {
    return {
        type: String,
        default: defaultValue,
    };
}
