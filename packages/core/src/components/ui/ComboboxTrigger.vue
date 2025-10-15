<template>
    <ComboboxAnchor>
        <ComboboxInput
            :id="select.id"
            v-model="combobox.input"
            :placeholder="select.placeholder"
            :class="renderedRootClasses"
            :display-value="select.renderOption"
            :name="select.name"
            @focus="$emit('focus')"
            @blur="onBlur()"
            @keydown.esc="$emit('blur')"
        />
    </ComboboxAnchor>
</template>

<script setup lang="ts">
import { ComboboxAnchor, ComboboxInput } from 'reka-ui';
import { computed, watch } from 'vue';

import { classes, injectReactiveOrFail } from '@aerogel/core/utils';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';
import type { ComboboxContext } from '@aerogel/core/components/contracts/Combobox';

const emit = defineEmits<{ focus: []; change: []; blur: [] }>();
const select = injectReactiveOrFail<SelectExpose>('select', '<ComboboxTrigger> must be a child of a <Combobox>');
const combobox = injectReactiveOrFail<ComboboxContext>('combobox');
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

function onBlur() {
    const elements = Array.from(document.querySelectorAll(':hover'));

    if (elements.some((element) => combobox.$group?.contains(element))) {
        return;
    }

    emit('blur');
}

watch(
    () => combobox.input,
    () => {
        if (combobox.preventChange) {
            combobox.preventChange = false;

            return;
        }

        emit('change');
    },
);
</script>
