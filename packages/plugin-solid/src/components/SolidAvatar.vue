<template>
    <div class="relative flex items-center justify-center rounded-full bg-gray-200">
        <SolidImage
            v-if="profile?.avatarUrl"
            :src="profile?.avatarUrl"
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
import Solid from '@aerogel/plugin-solid/services/Solid';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';
import { computed } from 'vue';
import IconAnonymous from '~icons/ooui/user-anonymous';

import SolidImage from './SolidImage.vue';

const { user } = defineProps<{ user?: SolidUserProfile }>();
const profile = computed(() => user ?? Solid.user);

const userInitials = computed(() => {
    const name = profile.value?.name ?? '';

    return name
        .trim()
        .split(' ')
        .map((part) => part[0]?.toUpperCase())
        .join('')
        .slice(0, 3);
});
</script>
