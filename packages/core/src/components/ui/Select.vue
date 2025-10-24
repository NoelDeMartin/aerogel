<template>
    <HeadlessSelect :ref="forwardRef" v-bind="$props" @update:model-value="$emit('update:modelValue', $event)">
        <SelectLabel />
        <slot>
            <SelectTrigger />
            <HeadlessSelectError class="mt-2 text-sm text-red-600" />
            <SelectOptions />
        </slot>
    </HeadlessSelect>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { useForwardExpose } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import HeadlessSelect from '@aerogel/core/components/headless/HeadlessSelect.vue';
import type { SelectEmits, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms';

import SelectLabel from './SelectLabel.vue';
import SelectOptions from './SelectOptions.vue';
import SelectTrigger from './SelectTrigger.vue';
import HeadlessSelectError from '../headless/HeadlessSelectError.vue';

defineProps<SelectProps<T>>();
defineEmits<SelectEmits<T>>();

const { forwardRef } = useForwardExpose();
</script>
