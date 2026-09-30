<template>
    <HeadlessComboboxOption v-bind="$props" class="group outline-none" @select="$emit('select', $event)">
        <ComboboxOptionContent>
            <slot />
        </ComboboxOptionContent>
    </HeadlessComboboxOption>
</template>

<script setup lang="ts">
import type { ComboboxItemProps, SelectItemSelectEvent } from 'reka-ui';

import ComboboxOptionContent from './ComboboxOptionContent.vue';
import HeadlessComboboxOption from '../headless/HeadlessComboboxOption.vue';

defineProps<ComboboxItemProps>();
defineEmits<{ select: [event: SelectItemSelectEvent<unknown>] }>();
</script>
