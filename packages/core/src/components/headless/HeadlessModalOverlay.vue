<template>
    <DialogOverlay v-bind="props">
        <slot />
    </DialogOverlay>
</template>

<script setup lang="ts">
import { DialogOverlay } from 'reka-ui';
import type { DialogOverlayProps } from 'reka-ui';

const props = defineProps<DialogOverlayProps>();
</script>
