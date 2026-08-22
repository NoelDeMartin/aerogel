<template>
    <ComboboxRoot
        :name
        :open
        :disabled
        :ignore-filter
        :reset-search-term-on-blur
        :reset-search-term-on-select
        :model-value="acceptableValue"
        :by="compareOptions"
        :class="wrapperClass"
        @update:open="emit('update:open', $event)"
        @update:model-value="update($event)"
    >
        <component :is="as" v-bind="$attrs">
            <slot :model-value :open />
        </component>
    </ComboboxRoot>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { ComboboxRoot } from 'reka-ui';
import { computed } from 'vue';
import type { HTMLAttributes } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import { useCombobox } from '@aerogel/core/components/contracts/Combobox';
import type { ComboboxEmits, ComboboxProps } from '@aerogel/core/components/contracts/Combobox';
import type { FormFieldValue } from '@aerogel/core/forms';

defineOptions({ inheritAttrs: false });

const emit = defineEmits<ComboboxEmits<T>>();

const {
    as = 'div',
    compareOptions = (a, b) => a === b,
    ignoreFilter = false,
    resetSearchTermOnBlur = true,
    resetSearchTermOnSelect = true,
    disabled = false,
    open,
    wrapperClass,
    ...props
} = defineProps<
    ComboboxProps<T> & {
        open?: boolean;
        ignoreFilter?: boolean;
        resetSearchTermOnBlur?: boolean;
        resetSearchTermOnSelect?: boolean;
        disabled?: boolean;
        wrapperClass?: HTMLAttributes['class'];
    }
>();

const { expose, acceptableValue, update } = useCombobox(
    computed(() => ({ as, compareOptions, ...props })),
    emit,
);

defineExpose(expose);
</script>
