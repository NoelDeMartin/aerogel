<template>
    <SelectItem v-bind="$props">
        <SelectItemText class="the-text">
            <slot>
                {{ renderedLabel }}
            </slot>
        </SelectItemText>
    </SelectItem>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SelectItem, SelectItemText } from 'reka-ui';
import { toString } from '@noeldemartin/utils';
import type { SelectItemProps } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { SelectExpose } from '@aerogel/core/components/contracts/Select';

const { value } = defineProps<SelectItemProps>();
const select = injectReactiveOrFail<SelectExpose>(
    'select',
    '<HeadlessSelectOption> must be a child of a <HeadlessSelect>',
);
const renderedLabel = computed(() => {
    const itemOption = select.options?.find((option) => option.value === value);

    if (itemOption) {
        return itemOption.label;
    }

    return toString(value);
});
</script>
