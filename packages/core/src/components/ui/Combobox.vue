<template>
    <ComboboxRoot
        ignore-filter
        :open
        :reset-search-term-on-blur="false"
        :reset-search-term-on-select="false"
        :model-value="acceptableValue"
        :by="compareOptions"
        @update:model-value="update($event)"
    >
        <Provide name="combobox" :value="combobox">
            <ComboboxLabel />
            <ComboboxTrigger @focus="open = true" @change="open = true" @blur="open = false" />
            <ComboboxOptions :new-input-value @select="open = false" />
        </Provide>
    </ComboboxRoot>
</template>

<script setup lang="ts" generic="T extends Nullable<FormFieldValue>">
import { ComboboxRoot } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import type { AcceptableValue } from 'reka-ui';
import type { Nullable } from '@noeldemartin/utils';

import Provide from '@aerogel/core/components/vue/Provide.vue';
import { useSelect } from '@aerogel/core/components/contracts/Select';
import type { AcceptRefs } from '@aerogel/core/utils';
import type { ComboboxContext } from '@aerogel/core/components/contracts/Combobox';
import type { SelectEmits, SelectProps } from '@aerogel/core/components/contracts/Select';
import type { FormFieldValue } from '@aerogel/core/forms';

import ComboboxOptions from './ComboboxOptions.vue';
import ComboboxTrigger from './ComboboxTrigger.vue';
import ComboboxLabel from './ComboboxLabel.vue';

const emit = defineEmits<SelectEmits<T>>();
const {
    as = 'div',
    compareOptions = (a, b) => a === b,
    newInputValue,
    ...props
} = defineProps<SelectProps<T> & { newInputValue?: (value: string) => T }>();
const {
    expose,
    acceptableValue,
    update: baseUpdate,
    renderOption,
} = useSelect(
    computed(() => ({ as, compareOptions, ...props })),
    emit,
);
const open = ref(false);
const combobox = {
    input: ref(acceptableValue.value ? renderOption(acceptableValue.value as T) : ''),
    preventChange: ref(false),
    $group: ref(null),
} satisfies AcceptRefs<ComboboxContext>;

function update(value: AcceptableValue) {
    combobox.input.value = renderOption(value as T);

    baseUpdate(value);
}

watch(combobox.input, (value) => {
    const newInputOption = newInputValue ? (newInputValue(value) as AcceptableValue) : value;
    const renderedValue = renderOption(expose.value.value);
    const renderedNewInputOption = renderOption(expose.value.value as T);

    if (renderedValue === renderedNewInputOption) {
        return;
    }

    update(newInputOption);
});

defineExpose(expose);
</script>
