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

                <ComboboxGroup>
                    <ComboboxOption
                        v-if="showInputOption"
                        :value="newInputValue?.(input) ?? (input as AcceptableValue)"
                    >
                        {{ input }}
                    </ComboboxOption>
                    <ComboboxOption v-for="option in filteredOptions" :key="option.key" :value="option.value" />
                </ComboboxGroup>
            </ComboboxViewport>
        </ComboboxContent>
    </ComboboxPortal>
</template>

<script setup lang="ts">
import { ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxPortal, ComboboxViewport, useFilter } from 'reka-ui';
import { computed } from 'vue';
import type { Ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';
import type { AcceptableValue } from 'reka-ui';

import { classes, injectOrFail, injectReactiveOrFail } from '@aerogel/core/utils';
import type { FormFieldValue } from '@aerogel/core/forms';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

import ComboboxOption from './ComboboxOption.vue';

const { contains } = useFilter({ sensitivity: 'base' });
const { newInputValue } = defineProps<{ newInputValue?: (value: string) => Nullable<FormFieldValue> }>();
const select = injectReactiveOrFail<SelectExpose>('select', '<ComboboxOptions> must be a child of a <Combobox>');
const input = injectOrFail<Ref<string>>('combobox-input');
const filteredOptions = computed(() => select.options?.filter((option) => contains(option.label, input.value)) ?? []);
const showInputOption = computed(
    () => input.value && !filteredOptions.value.some((option) => option.label === input.value),
);
const renderedClasses = classes(
    'max-h-(--reka-combobox-content-available-height) min-w-(--reka-combobox-trigger-width)',
    'z-50 overflow-auto rounded-lg bg-white text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden',
);
</script>
