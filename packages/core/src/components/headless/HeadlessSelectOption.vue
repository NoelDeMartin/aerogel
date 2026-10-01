<template>
    <SelectItem v-bind="$props">
        <SelectItemText>
            <slot>
                {{ renderedLabel }}
            </slot>
        </SelectItemText>
    </SelectItem>
</template>

<script setup lang="ts">
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { toString } from '@noeldemartin/utils';
import { SelectItem, SelectItemText } from 'reka-ui';
import type { SelectItemProps } from 'reka-ui';
import { computed } from 'vue';

const { value } = defineProps<SelectItemProps>();
const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectOption> must be a child of a <HeadlessSelect>',
);
const renderedLabel = computed(() => {
    const itemOption = select.options?.find((option) => option.value === value);

    return itemOption ? select.renderOption(itemOption.value) : toString(value);
});
</script>
