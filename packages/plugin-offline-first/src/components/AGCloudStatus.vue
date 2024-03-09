<template>
    <AGSolidStatus>
        <template #logged-in="{ session }: IAGSolidStatusLoggedInSlotProps">
            <AGMarkdown v-if="$cloud.syncing" :text="$td('cloud.syncing', 'Syncing...')" />
            <div v-else class="flex flex-col gap-3">
                <AGMarkdown
                    :text="
                        $td('solid.loggedIn', 'You are logged in as [{userName}]({userWebId})', {
                            userName: session.user.name ?? session.user.webId,
                            userWebId: session.user.webId,
                        })
                    "
                />
                <AGButton @click="$cloud.sync(), $emit('sync')">
                    {{ $td('cloud.sync', 'Synchronize') }}
                </AGButton>
                <AGButton @click="$solid.logout()">
                    {{ $td('solid.logout', 'Logout') }}
                </AGButton>
            </div>
        </template>
    </AGSolidStatus>
</template>

<script setup lang="ts">
import { AGButton, AGMarkdown } from '@aerogel/core';
import { AGSolidStatus } from '@aerogel/plugin-solid';
import type { IAGSolidStatusLoggedInSlotProps } from '@aerogel/plugin-solid';

defineEmits(['sync']);
</script>
