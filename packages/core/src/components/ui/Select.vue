<template>
    <HeadlessSelect :ref="forwardRef" v-bind="$props" @update:model-value="$emit('update:modelValue', $event)">
        <SelectLabel />
        <slot>
            <SelectTrigger />
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

defineProps<SelectProps<T>>();
defineEmits<SelectEmits<T>>();

const { forwardRef } = useForwardExpose();
</script>
