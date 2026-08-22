<template>
    <ComboboxAnchor class="relative">
        <ComboboxInput
            v-bind="$attrs"
            :id="id ?? combobox.id"
            :model-value="modelValue ?? combobox.input"
            :placeholder="placeholder ?? combobox.placeholder"
            :name="name ?? combobox.name"
            :display-value="displayValue ?? combobox.renderOption"
            @update:model-value="onInput"
            @focus="$emit('focus')"
            @blur="onBlur"
            @keydown.esc="$emit('blur')"
        />
        <slot />
    </ComboboxAnchor>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { ComboboxAnchor, ComboboxInput } from 'reka-ui';
import { watch } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { FormFieldValue } from '@aerogel/core/forms';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

defineOptions({ inheritAttrs: false });
defineProps<{
    id?: string;
    placeholder?: string;
    name?: string;
    displayValue?: (value: T) => string;
    modelValue?: string;
}>();

const emit = defineEmits<{
    focus: [];
    change: [];
    blur: [];
    'update:modelValue': [value: string];
}>();

const combobox = injectReactiveOrFail<ComboboxExpose>(
    'combobox',
    '<HeadlessComboboxInput> must be a child of a <HeadlessCombobox>',
);

const onInput = (value: string) => {
    combobox.input = value;

    emit('update:modelValue', value);
};

function onBlur() {
    const elements = Array.from(document.querySelectorAll(':hover'));

    if (elements.some((element) => combobox.$group?.contains(element))) {
        return;
    }

    emit('blur');
}

watch(
    () => combobox.input,
    (val) => {
        emit('update:modelValue', val);

        if (combobox.preventChange) {
            combobox.preventChange = false;

            return;
        }

        emit('change');
    },
);
</script>
