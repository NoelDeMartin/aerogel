<template>
    <Markdown :text="message" inline />
</template>

<script setup lang="ts">
import Markdown from '@aerogel/core/components/ui/Markdown.vue';
import type { ErrorSource } from '@aerogel/core/errors/Errors.state';
import { getErrorMessage } from '@aerogel/core/errors/utils';
import { computed } from 'vue';

const { error } = defineProps<{ error: ErrorSource }>();
const message = computed(() => getErrorMessage(error));
</script>
