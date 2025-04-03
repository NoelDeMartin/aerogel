<template>
    <Button variant="link" v-bind="props">
        <slot />
    </Button>
</template>

<script setup lang="ts">
import type { IButtonProps } from '@aerogel/core/components/contracts/Button';

import Button from './Button.vue';

const props = defineProps<Omit<IButtonProps, 'variant'>>();
</script>
