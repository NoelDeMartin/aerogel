<template>
    <HeadlessComboboxContent :class="renderedClasses">
        <HeadlessComboboxEmpty class="group p-1 outline-none">
            <div
                class="relative flex max-w-[calc(100vw-2rem)] select-none items-center gap-2 truncate rounded-md px-2 py-1 text-sm *:truncate"
            >
                {{ $td('ui.comboboxEmpty', 'No options found') }}
            </div>
        </HeadlessComboboxEmpty>

        <HeadlessComboboxGroup>
            <ComboboxOption
                v-if="showInputOption"
                :value="newInputValue?.(combobox.input) ?? (combobox.input as AcceptableValue)"
                @select="$emit('select')"
            >
                {{ combobox.input }}
            </ComboboxOption>
            <ComboboxOption
                v-for="option in filteredOptions"
                :key="option.key"
                :value="option.value"
                @select="$emit('select')"
            >
                {{ option.label }}
            </ComboboxOption>
        </HeadlessComboboxGroup>
    </HeadlessComboboxContent>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useFilter } from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { FormFieldValue } from '@aerogel/core/forms';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

import ComboboxOption from './ComboboxOption.vue';
import HeadlessComboboxContent from '../headless/HeadlessComboboxContent.vue';
import HeadlessComboboxEmpty from '../headless/HeadlessComboboxEmpty.vue';
import HeadlessComboboxGroup from '../headless/HeadlessComboboxGroup.vue';

defineEmits<{ select: [] }>();

const { newInputValue } = defineProps<{ newInputValue?: (value: string) => Nullable<FormFieldValue> }>();
const { contains } = useFilter({ sensitivity: 'base' });
const combobox = injectReactiveOrFail<ComboboxExpose>('combobox', '<ComboboxOptions> must be a child of a <Combobox>');

const filteredOptions = computed(
    () => combobox.options?.filter((option) => contains(option.label, combobox.input)) ?? [],
);
const showInputOption = computed(
    () => combobox.input && !filteredOptions.value.some((option) => option.label === combobox.input),
);
const renderedClasses = classes(
    'max-h-(--reka-combobox-content-available-height) min-w-(--reka-combobox-trigger-width)',
    'z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden',
);
</script>
