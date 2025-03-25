<template>
    <AGMarkdown :text="message" inline />
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { requiredObjectProp } from '@aerogel/core/utils/vue';
import { getErrorMessage } from '@aerogel/core/errors/utils';
import type { ErrorSource } from '@aerogel/core/errors/Errors.state';

import AGMarkdown from './AGMarkdown.vue';

const props = defineProps({ error: requiredObjectProp<ErrorSource>() });
const message = computed(() => getErrorMessage(props.error));
</script>
