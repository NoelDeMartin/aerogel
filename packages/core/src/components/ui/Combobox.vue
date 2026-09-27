<template>
    <HeadlessCombobox
        :ref="forwardRef"
        v-bind="$props"
        v-model:open="open"
        :ignore-filter="true"
        :reset-search-term-on-blur="false"
        :reset-search-term-on-select="false"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <ComboboxLabel />
        <slot>
            <ComboboxTrigger @focus="open = true" @change="open = true" @blur="open = false" />
            <HeadlessSelectError class="mt-2 text-sm text-red-600" />
            <ComboboxOptions :new-input-value="newInputValue" @select="open = false" />
        </slot>
    </HeadlessCombobox>
</template>

<script setup lang="ts" generic="T">
import { ref } from 'vue';

import { useForwardExpose } from '@aerogel/core/utils/composition/expose';
import type { ComboboxEmits, ComboboxExpose, ComboboxProps } from '@aerogel/core/components/contracts/Combobox';

import ComboboxLabel from './ComboboxLabel.vue';
import ComboboxOptions from './ComboboxOptions.vue';
import ComboboxTrigger from './ComboboxTrigger.vue';
import HeadlessCombobox from '../headless/HeadlessCombobox.vue';
import HeadlessSelectError from '../headless/HeadlessSelectError.vue';

defineOptions({ inheritAttrs: false });
defineProps<ComboboxProps<T>>();
defineExpose<ComboboxExpose<T, HTMLInputElement>>();

const emit = defineEmits<ComboboxEmits<T>>();
const open = ref(false);
const { forwardRef } = useForwardExpose();
</script>
