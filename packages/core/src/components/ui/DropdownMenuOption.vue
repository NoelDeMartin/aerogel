<template>
    <DropdownMenuItem
        class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-900 data-[highlighted]:bg-gray-100"
        @select="$emit('select')"
    >
        <slot />
    </DropdownMenuItem>
</template>

<script setup lang="ts">
import { DropdownMenuItem } from 'reka-ui';

defineEmits<{ select: [] }>();
</script>
