import type { ComputedRef, DeepReadonly, Ref } from 'vue';

export interface IAGHeadlessInput {
    id: string;
    value: ComputedRef<string | number | boolean | null>;
    errors: DeepReadonly<Ref<string[] | null>>;
    update(value: string | number | boolean | null): void;
}
