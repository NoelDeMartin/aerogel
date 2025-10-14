<template>
    <ComboboxItem v-bind="$props" class="group p-1 outline-none" @select="onSelect($event)">
        <div
            class="relative flex max-w-[calc(100vw-2rem)] cursor-pointer items-center gap-2 truncate rounded-md px-2 py-1 text-sm select-none *:truncate group-data-[highlighted]:bg-gray-100 group-data-[state=checked]:font-semibold group-data-[state=unchecked]:opacity-50"
        >
            <slot>
                {{ renderedLabel }}
            </slot>
        </div>
    </ComboboxItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ComboboxItem, injectComboboxRootContext } from 'reka-ui';
import { toString } from '@noeldemartin/utils';
import type { ComboboxItemProps, SelectItemSelectEvent } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { ComboboxContext } from '@aerogel/core/components/contracts/Combobox';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const emit = defineEmits<{ select: [] }>();

const { value } = defineProps<ComboboxItemProps>();
const select = injectReactiveOrFail<SelectExpose>('select', '<ComboboxOption> must be a child of a <Combobox>');
const rootContext = injectComboboxRootContext();
const combobox = injectReactiveOrFail<ComboboxContext>('combobox');
const renderedLabel = computed(() => {
    const itemOption = select.options?.find((option) => option.value === value);

    return itemOption ? select.renderOption(itemOption.value) : toString(value);
});

function onSelect(event: SelectItemSelectEvent<unknown>) {
    if (rootContext.multiple.value || rootContext.disabled.value) {
        return;
    }

    event.preventDefault();
    combobox.preventChange = true;
    rootContext.modelValue.value = value;

    emit('select');
}
</script>
