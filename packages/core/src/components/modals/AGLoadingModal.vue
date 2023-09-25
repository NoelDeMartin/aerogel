<template>
    <AGModal :cancellable="false">
        <AGMarkdown :text="renderedMessage" />
    </AGModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { stringProp } from '@/utils/vue';
import { translateWithDefault } from '@/lang/utils';

import AGModal from './AGModal.vue';

import AGMarkdown from '../basic/AGMarkdown.vue';

const props = defineProps({ message: stringProp() });
const renderedMessage = computed(() => props.message ?? translateWithDefault('ui.loading', 'Loading...'));
</script>
