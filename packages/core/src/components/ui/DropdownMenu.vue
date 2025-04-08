<template>
    <DropdownMenuRoot>
        <DropdownMenuTrigger>
            <slot />
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
            <DropdownMenuContent class="gap-y-0.5 rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-black/5" :align>
                <DropdownMenuItem
                    v-for="(option, key) in options"
                    :key
                    class="flex w-full items-center rounded-lg px-2 py-2 text-sm text-gray-900 data-[highlighted]:bg-gray-100"
                    @select="option.click"
                >
                    {{ option.label }}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>

<script setup lang="ts">
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
} from 'reka-ui';

import type { DropdownMenuProps } from '@aerogel/core/components/contracts/DropdownMenu';

defineProps<DropdownMenuProps>();
</script>
