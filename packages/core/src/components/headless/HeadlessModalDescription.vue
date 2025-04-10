<template>
    <DialogDescription v-bind="$props">
        <slot />
    </DialogDescription>
</template>

<script setup lang="ts">
import { DialogDescription } from 'reka-ui';
import type { DialogDescriptionProps } from 'reka-ui';

defineProps<DialogDescriptionProps>();
</script>
