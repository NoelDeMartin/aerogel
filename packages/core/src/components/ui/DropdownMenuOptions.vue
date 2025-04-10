<template>
    <DropdownMenuContent
        class="gap-y-0.5 rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-black/5"
        :align="dropdownMenu.align"
        :side="dropdownMenu.side"
    >
        <slot>
            <DropdownMenuOption v-for="(option, key) in dropdownMenu.options" :key @select="option.click">
                {{ option.label }}
            </DropdownMenuOption>
        </slot>
    </DropdownMenuContent>
</template>

<script setup lang="ts">
import { DropdownMenuContent } from 'reka-ui';

import { injectReactiveOrFail } from '@aerogel/core/utils';
import type { DropdownMenuExpose } from '@aerogel/core/components/contracts/DropdownMenu';

import DropdownMenuOption from './DropdownMenuOption.vue';

const dropdownMenu = injectReactiveOrFail<DropdownMenuExpose>(
    'dropdown-menu',
    '<DropdownMenuOptions> must be a child of a <DropdownMenu>',
);
</script>
