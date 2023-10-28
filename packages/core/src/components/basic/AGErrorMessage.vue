<template>
    <AGMarkdown :text="message" inline />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Errors from '@/errors/Errors';
import { requiredObjectProp } from '@/utils/vue';
import type { ErrorSource } from '@/errors/Errors.state';

import AGMarkdown from './AGMarkdown.vue';

const props = defineProps({ error: requiredObjectProp<ErrorSource>() });
const message = computed(() => Errors.getErrorMessage(props.error));
</script>
