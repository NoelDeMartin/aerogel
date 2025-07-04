<template>
    <form @submit.prevent="form ? form.submit() : $emit('submit')">
        <slot />
    </form>
</template>

<script setup lang="ts">
import { provide, watchEffect } from 'vue';

import type FormController from '@aerogel/core/forms/FormController';

let offSubmit: (() => void) | undefined;
const { form } = defineProps<{ form?: FormController }>();
const emit = defineEmits<{ submit: [] }>();

watchEffect((onCleanup) => {
    offSubmit?.();
    offSubmit = form?.on('submit', () => emit('submit'));

    onCleanup(() => offSubmit?.());
});

provide('form', form);
</script>
