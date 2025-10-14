import type { Ref } from 'vue';

export type ComboboxContext = {
    input: Ref<string>;
    preventChange: Ref<boolean>;
    $group: Ref<HTMLDivElement | null>;
};
