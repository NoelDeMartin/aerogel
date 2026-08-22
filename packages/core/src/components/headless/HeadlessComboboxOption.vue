<template>
    <ComboboxItem v-bind="$props" @select="onSelect($event)">
        <slot>
            {{ renderedLabel }}
        </slot>
    </ComboboxItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ComboboxItem, injectComboboxRootContext } from 'reka-ui';
import type { ComboboxItemProps, SelectItemSelectEvent } from 'reka-ui';
import { toString } from '@noeldemartin/utils';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { ComboboxExpose } from '@aerogel/core/components/contracts/Combobox';

const props = defineProps<ComboboxItemProps>();
const emit = defineEmits<{ select: [event: SelectItemSelectEvent<unknown>] }>();

const combobox = injectReactiveOrFail<ComboboxExpose>(
    'combobox',
    '<HeadlessComboboxOption> must be a child of a <HeadlessCombobox>',
);
const rootContext = injectComboboxRootContext();

const renderedLabel = computed(() => {
    const itemOption = combobox.options?.find((option) => option.value === props.value);

    return itemOption ? combobox.renderOption(itemOption.value) : toString(props.value);
});

function onSelect(event: SelectItemSelectEvent<unknown>) {
    emit('select', event);

    if (event.defaultPrevented) {
        return;
    }

    if (rootContext.multiple.value || rootContext.disabled.value) {
        return;
    }

    event.preventDefault();
    combobox.preventChange = true;
    rootContext.modelValue.value = props.value;
}
</script>
