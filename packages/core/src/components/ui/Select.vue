<template>
    <HeadlessSelect :ref="forwardRef" v-bind="$props" @update:model-value="$emit('update:modelValue', $event)">
        <SelectLabel />
        <slot>
            <SelectTrigger />
            <SelectOptions />
        </slot>
    </HeadlessSelect>
</template>

<script setup lang="ts">
import { useForwardExpose } from 'reka-ui';

import HeadlessSelect from '@aerogel/core/components/headless/HeadlessSelect.vue';
import type { SelectEmits, SelectProps } from '@aerogel/core/components/contracts/Select';

import SelectLabel from './SelectLabel.vue';
import SelectOptions from './SelectOptions.vue';
import SelectTrigger from './SelectTrigger.vue';

defineProps<SelectProps>();
defineEmits<SelectEmits>();

const { forwardRef } = useForwardExpose();
</script>
