<template>
    <AGModal>
        <AGMarkdown
            v-if="title"
            :text="title"
            as="h2"
            class="font-semibold"
            inline
        />
        <AGMarkdown :text="message" />
    </AGModal>
</template>

<script setup lang="ts">
import { requiredStringProp, stringProp } from '@/utils/vue';

import AGModal from './AGModal.vue';

import AGMarkdown from '../basic/AGMarkdown.vue';

defineProps({
    title: stringProp(),
    message: requiredStringProp(),
});
</script>
