<template>
    <ComboboxAnchor ref="$anchorRef" :class="renderedAnchorClasses" @click="focus()">
        <slot name="chips" :items="combobox.selectedItems" :remove="combobox.remove" />
        <ComboboxInput
            :id="id ?? combobox.id"
            ref="$controlRef"
            v-bind="$attrs"
            :model-value="modelValue ?? combobox.input"
            :placeholder="renderedPlaceholder"
            :name="name ?? combobox.name"
            :display-value="combobox.multiple ? undefined : (displayValue ?? combobox.renderOption)"
            @update:model-value="onInput"
            @focus="$emit('focus')"
            @blur="onBlur"
            @keydown.backspace="onBackspace"
            @keydown.esc="$emit('blur')"
        />
        <slot />
    </ComboboxAnchor>
</template>

<script setup lang="ts" generic="T">
import { ComboboxAnchor, ComboboxInput } from 'reka-ui';
import { computed, useTemplateRef, watch, watchEffect } from 'vue';
import type { HTMLAttributes } from 'vue';

import { classes, injectReactiveOrFail, isHovered } from '@aerogel/core/utils';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

defineOptions({ inheritAttrs: false });

const { placeholder, anchorClass } = defineProps<{
    id?: string;
    placeholder?: string;
    name?: string;
    displayValue?: (value: T) => string;
    modelValue?: string;
    anchorClass?: HTMLAttributes['class'];
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

const $anchor = useTemplateRef('$anchorRef');
const $control = useTemplateRef('$controlRef');
const renderedAnchorClasses = computed(() => classes('relative', anchorClass));
const renderedPlaceholder = computed(() => {
    if (combobox.multiple && combobox.selectedItems.length > 0) {
        return '';
    }

    return placeholder ?? combobox.placeholder;
});

const onInput = (value: string) => {
    combobox.input = value;

    emit('update:modelValue', value);
};

function focus() {
    $control.value?.$el?.focus();
}

function onBlur() {
    if (isHovered(combobox.$group, combobox.multiple ? $anchor.value?.$el : null)) {
        return;
    }

    emit('blur');
}

function onBackspace() {
    const lastItem = combobox.selectedItems[combobox.selectedItems.length - 1];

    if (!combobox.multiple || combobox.input !== '' || lastItem === undefined) {
        return;
    }

    combobox.remove(lastItem);
}

watchEffect(() => (combobox.$control = $control.value?.$el ?? null));

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
