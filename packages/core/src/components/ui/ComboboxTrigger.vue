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
                class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-white/10 dark:text-gray-200"
            >
                <span>{{ combobox.renderOption(item) }}</span>
                <button
                    type="button"
                    tabindex="-1"
                    :title="$td('ui.remove', 'Remove')"
                    class="cursor-pointer text-gray-400 hover:text-gray-600 focus:outline-hidden dark:hover:text-gray-200"
                    @click.stop="remove(item)"
                >
                    <IconClose class="size-2.5" />
                    <span class="sr-only">{{
                        $td('ui.removeItem', 'Remove {item}', { item: combobox.renderOption(item) })
                    }}</span>
                </button>
            </span>
        </template>

        <div v-if="combobox.errors" class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <IconExclamationSolid class="size-5 text-red-500" />
        </div>
    </HeadlessComboboxInput>
</template>

<script setup lang="ts">
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';
import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import { computed } from 'vue';
import IconClose from '~icons/zondicons/close';
import IconExclamationSolid from '~icons/zondicons/exclamation-solid';

import HeadlessComboboxInput from '../headless/HeadlessComboboxInput.vue';

defineEmits<{ focus: []; change: []; blur: [] }>();

const combobox = injectReactiveOrFail<ComboboxExpose>('combobox', '<ComboboxTrigger> must be a child of a <Combobox>');

const renderedSingleClasses = computed(() =>
    classes(
        'block w-full rounded-md border-0 bg-surface py-1.5 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6',
        {
            'mt-1': combobox.label,
            'focus:ring-focus': !combobox.errors,
            'text-primary-text shadow-2xs ring-gray-900/10 dark:ring-white/15 placeholder:text-gray-400 dark:placeholder:text-gray-500':
                !combobox.errors,
            'pr-10 text-red-900 dark:text-red-300 ring-red-900/10 dark:ring-red-400/30 placeholder:text-red-300 dark:placeholder:text-red-400/50 focus:ring-red-500':
                combobox.errors,
        },
    ),
);

const renderedMultiClasses = computed(() =>
    classes(
        'relative flex min-h-[38px] w-full flex-wrap items-center gap-1.5 rounded-md border-0 bg-surface px-2.5 py-1 ring-1 ring-inset focus-within:ring-2 focus-within:ring-inset sm:text-sm sm:leading-6 cursor-text',
        {
            'mt-1': combobox.label,
            'focus-within:ring-focus': !combobox.errors,
            'text-primary-text shadow-2xs ring-gray-900/10 dark:ring-white/15': !combobox.errors,
            'pr-10 text-red-900 dark:text-red-300 ring-red-900/10 dark:ring-red-400/30 focus-within:ring-red-500':
                combobox.errors,
        },
    ),
);

const renderedMultiInputClasses =
    'min-w-16 flex-1 border-0 bg-transparent p-0 text-primary-text placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-hidden focus:ring-0 sm:text-sm sm:leading-6';
</script>
