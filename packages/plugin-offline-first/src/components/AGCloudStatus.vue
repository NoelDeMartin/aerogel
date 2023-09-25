<template>
    <AGSolidStatus>
        <template #logged-in>
            <AGMarkdown v-if="$cloud.syncing" :text="$td('cloud.syncing', 'Syncing...')" />
            <div v-else class="flex flex-col gap-3">
                <AGMarkdown
                    :text="
                        $td(
                            'solid.loggedIn',
                            {
                                userName: $solid.user.name ?? $solid.user.webId,
                                userWebId: $solid.user.webId,
                            },
                            'You are logged in as [{userName}]({userWebId})'
                        )
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
import { AGMarkdown, AGButton } from '@aerogel/core';
import { AGSolidStatus } from '@aerogel/plugin-solid';

defineEmits(['sync']);
</script>
