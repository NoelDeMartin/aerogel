<template>
    <form @submit.prevent="form?.submit()">
        <slot />
    </form>
</template>

<script setup lang="ts">
import { provide, watchEffect } from 'vue';

import { objectProp } from '@/utils/vue';
import type Form from '@/forms/Form';

let offSubmit: (() => void) | undefined;
const props = defineProps({ form: objectProp<Form>() });
const emit = defineEmits<{ submit: [] }>();

watchEffect((onCleanup) => {
    offSubmit?.();
    offSubmit = props.form?.on('submit', () => emit('submit'));

    onCleanup(() => offSubmit?.());
});

provide('form', props.form);
</script>
