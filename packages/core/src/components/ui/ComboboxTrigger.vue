<template>
    <HeadlessComboboxInput
        :class="combobox.multiple ? renderedMultiInputClasses : renderedSingleClasses"
        :anchor-class="combobox.multiple ? renderedMultiClasses : undefined"
        @focus="$emit('focus')"
        @blur="$emit('blur')"
        @change="$emit('change')"
    >
        <template v-if="combobox.multiple" #chips="{ items, remove }">
            <span
                v-for="(item, index) in items"
                :key="index"
                class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
            >
                <span>{{ combobox.renderOption(item) }}</span>
                <button
                    type="button"
                    tabindex="-1"
                    :title="$td('ui.remove', 'Remove')"
                    class="cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-hidden"
                    @click.stop="remove(item)"
                >
                    <IconClose class="size-2.5" />
                    <span class="sr-only">{{ $td('ui.removeItem', 'Remove {item}', { item: combobox.renderOption(item) }) }}</span>
                </button>
            </span>
        </template>

        <div v-if="combobox.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <IconExclamationSolid class="size-5 text-red-500" />
        </div>
    </HeadlessComboboxInput>
</template>

<script setup lang="ts">
import IconClose from '~icons/zondicons/close';
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';
import { computed } from 'vue';

import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

import HeadlessComboboxInput from '../headless/HeadlessComboboxInput.vue';

defineEmits<{ focus: []; change: []; blur: [] }>();

const combobox = injectReactiveOrFail<ComboboxExpose>('combobox', '<ComboboxTrigger> must be a child of a <Combobox>');

const renderedSingleClasses = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'block w-full rounded-md border-0 bg-white py-1.5 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
        {
            'mt-1': combobox.label,
            'focus:ring-primary-600': !combobox.errors,
            'text-gray-900 shadow-2xs ring-gray-900/10 placeholder:text-gray-400': !combobox.errors,
            'pr-10 text-red-900 ring-red-900/10 placeholder:text-red-300 focus:ring-red-500': combobox.errors,
        },
    ));

const renderedMultiClasses = computed(() =>
    classes(
        // eslint-disable-next-line vue/max-len
        'relative flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-md border-0 bg-white px-2.5 py-1 ring-1 ring-inset focus-within:ring-2 focus-within:ring-inset sm:text-sm sm:leading-6 cursor-text',
        {
            'mt-1': combobox.label,
            'focus-within:ring-primary-600': !combobox.errors,
            'text-gray-900 shadow-2xs ring-gray-900/10': !combobox.errors,
            'pr-10 text-red-900 ring-red-900/10 focus-within:ring-red-500': combobox.errors,
        },
    ));

// eslint-disable-next-line vue/max-len
const renderedMultiInputClasses = 'min-w-16 flex-1 border-0 bg-transparent p-0 text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-0 sm:text-sm sm:leading-6';
</script>
