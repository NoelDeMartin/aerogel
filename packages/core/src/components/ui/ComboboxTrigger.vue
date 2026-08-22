<template>
    <HeadlessComboboxInput
        :class="renderedRootClasses"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        @change="$emit('change')"
    >
        <div v-if="select?.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <IconExclamationSolid class="size-5 text-red-500" />
        </div>
    </HeadlessComboboxInput>
</template>

<script setup lang="ts">
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';

import { computed } from 'vue';

import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import HeadlessComboboxInput from '../headless/HeadlessComboboxInput.vue';

defineEmits<{ focus: []; change: []; blur: [] }>();

const select = injectReactiveOrFail<SelectExpose>('select', '<ComboboxTrigger> must be a child of a <Combobox>');
const renderedRootClasses = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'block w-full rounded-md border-0 py-1.5 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
        {
            'mt-1': select.label,
            'focus:ring-primary-600': !select.errors,
            'text-gray-900 shadow-2xs ring-gray-900/10 placeholder:text-gray-400': !select.errors,
            'pr-10 text-red-900 ring-red-900/10 placeholder:text-red-300 focus:ring-red-500': select.errors,
        },
    ));
</script>
