<template>
    <ComboboxRoot
        open-on-focus
        :model-value="acceptableValue"
        :by="compareOptions"
        @update:model-value="update($event)"
    >
        <ComboboxLabel />
        <ComboboxTrigger />
        <ComboboxOptions />
    </ComboboxRoot>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { ComboboxRoot } from 'reka-ui';
import { useSelect } from '@aerogel/core/components/contracts/Select';
import type { SelectEmits, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms';
import type { Nullable } from '@noeldemartin/utils';

import ComboboxOptions from './ComboboxOptions.vue';
import ComboboxTrigger from './ComboboxTrigger.vue';
import ComboboxLabel from './ComboboxLabel.vue';

const emit = defineEmits<SelectEmits<T>>();
const { as = 'div', compareOptions = (a, b) => a === b, ...props } = defineProps<SelectProps<T>>();
const { expose, acceptableValue, update } = useSelect({ as, compareOptions, ...props }, emit);

defineExpose(expose);
</script>
