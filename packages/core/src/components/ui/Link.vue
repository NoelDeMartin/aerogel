<template>
    <Button variant="link" v-bind="$props">
        <slot />
    </Button>
</template>

<script setup lang="ts">
import type { ButtonProps } from '@aerogel/core/components/contracts/Button';
import Button from '@aerogel/core/components/ui/Button.vue';

defineProps<Omit<ButtonProps, 'variant'>>();
</script>
