<template>
    <textarea
        :id="formControl.id"
        ref="$textAreaRef"
        :name
        :value
        :required="formControl.required ?? undefined"
        :aria-invalid="formControl.errors ? 'true' : 'false'"
        :aria-describedby="
            formControl.errors
                ? `${formControl.id}-error`
                : formControl.description
                    ? `${formControl.id}-description`
                    : undefined
        "
        @input="update"
    />
</template>

<script setup lang="ts">
import { computed, useTemplateRef, watchEffect } from 'vue';

import { exposeElementMethods } from '@aerogel/core/components/contracts/helpers';
import { onFormFocus } from '@aerogel/core/utils/composition/forms';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import type { FormControlExpose } from '@aerogel/core/components/contracts/FormControl';

const $textArea = useTemplateRef('$textAreaRef');
const formControl = injectReactiveOrFail<FormControlExpose>(
    'form-control',
    '<HeadlessFormControlTextArea> must be a child of a <HeadlessFormControl>',
);
const name = computed(() => formControl.name ?? undefined);
const value = computed(() => formControl.value as string);

function update() {
    if (!$textArea.value) {
        return;
    }

    formControl.update($textArea.value.value);
}

onFormFocus(formControl, () => $textArea.value?.focus());

watchEffect(() => (formControl.$control = $textArea.value ?? null));

defineExpose({
    $el: $textArea,
    ...exposeElementMethods(() => $textArea.value),
});
</script>
