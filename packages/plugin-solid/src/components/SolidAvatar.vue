<template>
    <div class="relative flex items-center justify-center rounded-full bg-gray-200">
        <SolidImage
            v-if="$solid.user?.avatarUrl"
            :src="$solid.user?.avatarUrl"
            alt=""
            class="absolute inset-0 size-full rounded-full"
        />
        <span v-else-if="userInitials" class="text-sm font-semibold tracking-wider text-gray-500" aria-hidden="true">
            {{ userInitials }}
        </span>
        <IconAnonymous v-else class="size-6 text-gray-500" />
    </div>
</template>

<script setup lang="ts">
import IconAnonymous from '~icons/ooui/user-anonymous';

import { computed } from 'vue';

import Solid from '@aerogel/plugin-solid/services/Solid';

import SolidImage from './SolidImage.vue';

const userInitials = computed(() => {
    const name = Solid.user?.name ?? '';

    return name
        .trim()
        .split(' ')
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 3);
});
</script>
