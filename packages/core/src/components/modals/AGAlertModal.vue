<template>
    <AGModal>
        <AGMarkdown :text="message" />
    </AGModal>
</template>

<script setup lang="ts">
import { requiredStringProp } from '@/utils/vue';

import AGModal from './AGModal.vue';

import AGMarkdown from '../basic/AGMarkdown.vue';

defineProps({ message: requiredStringProp() });
</script>
