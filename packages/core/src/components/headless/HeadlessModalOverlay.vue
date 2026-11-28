<template>
    <DialogOverlay v-bind="$props" force-mount>
        <slot />
    </DialogOverlay>
</template>

<script setup lang="ts">
import { DialogOverlay } from 'reka-ui';
import type { DialogOverlayProps } from 'reka-ui';

defineProps<DialogOverlayProps>();
</script>
