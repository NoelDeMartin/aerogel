<template>
    <ComboboxRoot
        open-on-focus
        ignore-filter
        :model-value="acceptableValue"
        :by="compareOptions"
        @update:model-value="update($event)"
    >
        <ProvideRef v-model="input" name="combobox-input">
            <ComboboxLabel />
            <ComboboxTrigger />
            <ComboboxOptions />
        </ProvideRef>
    </ComboboxRoot>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { ComboboxRoot } from 'reka-ui';
import { ref } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import ProvideRef from '@aerogel/core/components/vue/ProvideRef.vue';
import { useSelect } from '@aerogel/core/components/contracts/Select';
import type { SelectEmits, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms';

import ComboboxOptions from './ComboboxOptions.vue';
import ComboboxTrigger from './ComboboxTrigger.vue';
import ComboboxLabel from './ComboboxLabel.vue';

const emit = defineEmits<SelectEmits<T>>();
const { as = 'div', compareOptions = (a, b) => a === b, ...props } = defineProps<SelectProps<T>>();
const { expose, acceptableValue, update } = useSelect({ as, compareOptions, ...props }, emit);
const input = ref(acceptableValue.value ?? '');

defineExpose(expose);
</script>
