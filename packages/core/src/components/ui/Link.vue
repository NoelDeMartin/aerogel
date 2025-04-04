<template>
    <Button variant="link" v-bind="props">
        <slot />
    </Button>
</template>

<script setup lang="ts">
import Button from '@aerogel/core/components/ui/Button.vue';
import type { IButtonProps } from '@aerogel/core/components/contracts/Button';

const props = defineProps<Omit<IButtonProps, 'variant'>>();
</script>
