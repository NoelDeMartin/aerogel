<template>
    <ComboboxPortal>
        <ComboboxContent
            position="popper"
            :align="select.align"
            :side="select.side"
            :side-offset="4"
            :class="renderedClasses"
        >
            <ComboboxViewport>
                <ComboboxEmpty class="group p-1 outline-none">
                    <div
                        class="relative flex max-w-[calc(100vw-2rem)] items-center gap-2 truncate rounded-md px-2 py-1 text-sm select-none *:truncate"
                    >
                        {{ $td('ui.comboboxEmpty', 'No options found') }}
                    </div>
                </ComboboxEmpty>

                <ComboboxGroup ref="$group">
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
                    />
                </ComboboxGroup>
            </ComboboxViewport>
        </ComboboxContent>
    </ComboboxPortal>
</template>

<script setup lang="ts">
import { ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxPortal, ComboboxViewport, useFilter } from 'reka-ui';
import { computed, useTemplateRef, watch } from 'vue';
import type { Nullable } from '@noeldemartin/utils';
import type { AcceptableValue } from 'reka-ui';

import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { FormFieldValue } from '@aerogel/core/forms';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';
import type { ComboboxContext } from '@aerogel/core/components/contracts/Combobox';

import ComboboxOption from './ComboboxOption.vue';

defineEmits<{ select: [] }>();

const { newInputValue } = defineProps<{ newInputValue?: (value: string) => Nullable<FormFieldValue> }>();
const { contains } = useFilter({ sensitivity: 'base' });
const select = injectReactiveOrFail<SelectExpose>('select', '<ComboboxOptions> must be a child of a <Combobox>');
const combobox = injectReactiveOrFail<ComboboxContext>('combobox');
const $group = useTemplateRef('$group');
const filteredOptions = computed(
    () => select.options?.filter((option) => contains(option.label, combobox.input)) ?? [],
);
const showInputOption = computed(
    () => combobox.input && !filteredOptions.value.some((option) => option.label === combobox.input),
);
const renderedClasses = classes(
    'max-h-(--reka-combobox-content-available-height) min-w-(--reka-combobox-trigger-width)',
    'z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden',
);

watch($group, () => (combobox.$group = $group.value?.$el ?? null));
</script>
