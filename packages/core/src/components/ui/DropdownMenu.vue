<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger>
            <slot />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
            <slot name="options">
                <DropdownMenuOptions />
            </slot>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>

<script setup lang="ts">
import { DropdownMenuPortal, DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui';
import { provide } from 'vue';

import type { DropdownMenuExpose, DropdownMenuProps } from '@aerogel/core/components/contracts/DropdownMenu';

import DropdownMenuOptions from './DropdownMenuOptions.vue';

const { align, side, options } = defineProps<DropdownMenuProps>();
const expose = { align, side, options } satisfies DropdownMenuExpose;

provide('dropdown-menu', expose);
defineExpose(expose);
</script>
