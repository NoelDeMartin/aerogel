<template>
    <BaseModal :cancellable="false">
        <div class="flex items-center justify-center gap-2">
            <i-svg-spinners:90-ring-with-bg class="h-6 w-6" aria-hidden="true" />
            <AGMarkdown :text="renderedMessage" />
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { stringProp, translate } from '@aerogel/core';
import { computed } from 'vue';

const props = defineProps({ message: stringProp() });
const renderedMessage = computed(() => props.message ?? translate('ui.loading'));
</script>
