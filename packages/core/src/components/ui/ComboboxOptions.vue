<template>
    <HeadlessComboboxContent :class="renderedClasses" inner-class="flex min-h-0 flex-1 flex-col">
        <HeadlessComboboxEmpty class="group p-1 outline-none">
            <div
                class="relative flex max-w-[calc(100vw-2rem)] select-none items-center gap-2 truncate rounded-md px-2 py-1 text-sm *:truncate"
            >
                {{ $td('ui.comboboxEmpty', 'No options found') }}
            </div>
        </HeadlessComboboxEmpty>

        <div
            v-measure.watch="({ height }: ElementSize) => optionHeight = height"
            aria-hidden="true"
            class="pointer-events-none invisible absolute inset-x-0 top-0"
        >
            <ComboboxOptionContent>&nbsp;</ComboboxOptionContent>
        </div>

        <HeadlessComboboxGroup
            class="max-h-(--reka-combobox-content-available-height,20rem) min-h-0 flex-1 overflow-auto"
        >
            <ComboboxVirtualizer
                v-if="optionHeight"
                v-slot="{ option, virtualItem }"
                :key="optionHeight"
                :options="renderedOptions"
                :estimate-size="optionHeight"
            >
                <ComboboxOption class="w-full" :value="option" @select="onSelect">
                    {{ renderedItems[virtualItem.index]?.label }}
                </ComboboxOption>
            </ComboboxVirtualizer>
        </HeadlessComboboxGroup>
    </HeadlessComboboxContent>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ComboboxVirtualizer, useFilter } from 'reka-ui';
import type { AcceptableValue } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';
import type { ElementSize } from '@aerogel/core/directives/measure';

import ComboboxOption from './ComboboxOption.vue';
import ComboboxOptionContent from './ComboboxOptionContent.vue';
import HeadlessComboboxContent from '../headless/HeadlessComboboxContent.vue';
import HeadlessComboboxEmpty from '../headless/HeadlessComboboxEmpty.vue';
import HeadlessComboboxGroup from '../headless/HeadlessComboboxGroup.vue';

const emit = defineEmits<{ select: [] }>();
const { newInputValue, class: rootClasses } = defineProps<{
    newInputValue?: (value: string) => unknown;
    class?: HTMLAttributes['class'];
}>();
const { contains } = useFilter({ sensitivity: 'base' });
const combobox = injectReactiveOrFail<ComboboxExpose>('combobox', '<ComboboxOptions> must be a child of a <Combobox>');

const optionHeight = ref<number | null>(null);
const inputOption = computed(() => (newInputValue?.(combobox.input) ?? combobox.input) as AcceptableValue);
const filteredOptions = computed(
    () => combobox.options?.filter((option) => contains(option.label, combobox.input)) ?? [],
);
const showInputOption = computed(
    () => combobox.input.trim() !== '' && !filteredOptions.value.some((option) => option.label === combobox.input),
);

const renderedItems = computed(() => {
    const items = filteredOptions.value.map(({ value, label }) => ({ value, label }));

    return showInputOption.value ? [{ value: inputOption.value, label: combobox.input }, ...items] : items;
});

const renderedOptions = computed(() => renderedItems.value.map((item) => item.value));

const renderedClasses = computed(() =>
    classes(
        'z-50 overflow-hidden rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden',
        combobox.optionsClass,
        rootClasses,
    ));

function onSelect() {
    if (combobox.multiple) {
        return;
    }

    emit('select');
}
</script>
