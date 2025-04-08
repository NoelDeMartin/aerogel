<template>
    <Button variant="link" v-bind="$props">
        <slot />
    </Button>
</template>

<script setup lang="ts">
import Button from '@aerogel/core/components/ui/Button.vue';
import type { ButtonProps } from '@aerogel/core/components/contracts/Button';

defineProps<Omit<ButtonProps, 'variant'>>();
</script>
