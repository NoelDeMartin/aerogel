<template>
    <div class="relative flex items-center justify-center rounded-full bg-gray-200">
        <AGSolidImage
            v-if="$solid.user?.avatarUrl"
            :src="$solid.user?.avatarUrl"
            alt=""
            class="absolute inset-0 h-full w-full rounded-full"
        />
        <span class="text-sm font-semibold tracking-wider text-gray-500" aria-hidden="true">
            {{ userInitials }}
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Solid from '@/services/Solid';

const userInitials = computed(() => {
    const name = Solid.user?.name ?? '?';

    return name
        .split(' ')
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 3);
});
</script>
