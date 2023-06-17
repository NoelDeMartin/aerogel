<template>
    <form @submit.prevent="$emit('submit')">
        <slot />
    </form>
</template>

<script setup lang="ts">
import { provide } from 'vue';

import { objectProp } from '@/utils/vue';

const { form } = defineProps({ form: objectProp() });

defineEmits<{ submit: [] }>();

provide('form', form);
</script>
