<template>
    <DropdownMenuItem :class="renderedClasses" v-bind="props" @select="$emit('select')">
        <slot />
    </DropdownMenuItem>
</template>

<script setup lang="ts">
import { classes } from '@aerogel/core/utils';
import { computed } from 'vue';
import { DropdownMenuItem } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import type { PrimitiveProps } from 'reka-ui';

defineEmits<{ select: [] }>();

const { class: rootClass, ...props } = defineProps<{ class?: HTMLAttributes['class'] } & PrimitiveProps>();
const renderedClasses = computed(() =>
    classes(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-900 data-[highlighted]:bg-gray-100',
        rootClass,
    ));
</script>
