<template>
    <p v-if="errorMessage" :id="`${formControl.id}-error`">
        {{ errorMessage }}
    </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import type { FormControlExpose } from '@aerogel/core/components/contracts/FormControl';

const formControl = injectReactiveOrFail<FormControlExpose>(
    'form-control',
    '<HeadlessFormControlError> must be a child of a <HeadlessFormControl>',
);
const errorMessage = computed(() => {
    if (!formControl.errors) {
        return null;
    }

    return translateWithDefault(`errors.${formControl.errors[0]}`, `Error: ${formControl.errors[0]}`);
});
</script>
