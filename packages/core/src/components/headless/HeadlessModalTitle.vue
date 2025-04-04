<template>
    <DialogTitle v-bind="props">
        <slot />
    </DialogTitle>
</template>

<script setup lang="ts">
import { DialogTitle } from 'reka-ui';
import type { DialogTitleProps } from 'reka-ui';

const props = defineProps<DialogTitleProps>();
</script>
