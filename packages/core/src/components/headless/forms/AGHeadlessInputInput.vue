<template>
    <input
        :id="input.id"
        ref="$input"
        :name="name"
        :type="type"
        :required="input.required ?? undefined"
        :aria-invalid="input.errors ? 'true' : 'false'"
        :aria-describedby="
            input.errors ? `${input.id}-error` : input.description ? `${input.id}-description` : undefined
        "
        :checked="checked"
        @input="update"
    >
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';

import { injectReactiveOrFail, stringProp } from '@/utils/vue';
import type { __SetsElement } from '@/components/interfaces';
import type { FormFieldValue } from '@/forms/Form';
import type { IAGHeadlessInput } from '@/components/headless/forms/AGHeadlessInput';

import { onFormFocus } from './composition';

const props = defineProps({
    type: stringProp('text'),
});

const $input = ref<HTMLInputElement>();
const input = injectReactiveOrFail<IAGHeadlessInput>(
    'input',
    '<AGHeadlessInputInput> must be a child of a <AGHeadlessInput>',
);
const name = computed(() => input.name ?? undefined);
const value = computed(() => input.value);
const checked = computed(() => {
    if (props.type !== 'checkbox') {
        return;
    }

    return !!value.value;
});

function update() {
    if (!$input.value) {
        return;
    }

    input.update(getValue());
}

function getValue(): FormFieldValue | null {
    if (!$input.value) {
        return null;
    }

    switch (props.type) {
        case 'checkbox':
            return $input.value.checked;
        case 'date':
            return $input.value.valueAsDate;
        default:
            return $input.value.value;
    }
}

onFormFocus(input, () => $input.value?.focus());
watchEffect(() => (input as unknown as __SetsElement).__setElement($input.value));
watchEffect(() => {
    if (!$input.value) {
        return;
    }

    if (props.type === 'date') {
        $input.value.valueAsDate = value.value as Date;

        return;
    }

    $input.value.value = value.value as string;
});
</script>
