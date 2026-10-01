<template>
    <label v-if="show" :for="formControl.id">
        <slot>
            {{ formControl.label }}
        </slot>
    </label>
</template>

<script setup lang="ts">
import type { FormControlExpose } from '@aerogel/core/components/contracts/FormControl';
import { injectReactiveOrFail } from '@aerogel/core/utils/vue';
import { computed, useSlots } from 'vue';

const formControl = injectReactiveOrFail<FormControlExpose>(
    'form-control',
    '<HeadlessFormControlLabel> must be a child of a <HeadlessFormControl>',
);
const slots = useSlots();
const show = computed(() => !!(formControl.label || slots.default));
</script>
