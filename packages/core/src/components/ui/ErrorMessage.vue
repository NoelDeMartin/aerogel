<template>
    <Markdown :text="message" inline />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { getErrorMessage } from '@aerogel/core/errors/utils';
import type { ErrorSource } from '@aerogel/core/errors/Errors.state';

import Markdown from '@aerogel/core/components/ui/Markdown.vue';

const { error } = defineProps<{ error: ErrorSource }>();
const message = computed(() => getErrorMessage(error));
</script>
