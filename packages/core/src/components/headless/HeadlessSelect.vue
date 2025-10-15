<template>
    <SelectRoot
        v-slot="{ open }"
        :model-value="acceptableValue"
        :by="compareOptions"
        @update:model-value="update($event)"
    >
        <component :is="as" v-bind="$attrs">
            <slot :model-value :open>
                <HeadlessSelectTrigger />
                <HeadlessSelectOptions />
            </slot>
        </component>
    </SelectRoot>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { SelectRoot } from 'reka-ui';
import { computed } from 'vue';
import type { Nullable } from '@noeldemartin/utils';

import { useSelect } from '@aerogel/core/components/contracts/Select';
import type { SelectEmits, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms/FormController';

import HeadlessSelectTrigger from './HeadlessSelectTrigger.vue';
import HeadlessSelectOptions from './HeadlessSelectOptions.vue';

defineOptions({ inheritAttrs: false });

const emit = defineEmits<SelectEmits<T>>();
const { as = 'div', compareOptions = (a, b) => a === b, ...props } = defineProps<SelectProps<T>>();
const { expose, acceptableValue, update } = useSelect(
    computed(() => ({ as, compareOptions, ...props })),
    emit,
);

defineExpose(expose);
</script>
