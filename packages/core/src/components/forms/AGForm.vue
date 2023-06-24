<template>
    <form @submit.prevent="submit">
        <slot />
    </form>
</template>

<script setup lang="ts">
import { provide } from 'vue';

import { objectProp } from '@/utils/vue';
import type Form from '@/forms/Form';

const props = defineProps({ form: objectProp<Form>() });

const emit = defineEmits<{ submit: [] }>();

provide('form', props.form);

function submit() {
    if (props.form && !props.form.submit()) {
        return;
    }

    emit('submit');
}
</script>
