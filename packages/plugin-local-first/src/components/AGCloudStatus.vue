<template>
    <AGSolidStatus>
        <template #logged-in="{ session }: IAGSolidStatusLoggedInSlotProps">
            <Markdown v-if="$cloud.syncing" :text="$td('cloud.syncing', 'Syncing...')" />
            <div v-else class="flex flex-col gap-3">
                <Markdown
                    :text="
                        $td('solid.loggedIn', 'You are logged in as [{userName}]({userWebId})', {
                            userName: session.user.name ?? session.user.webId,
                            userWebId: session.user.webId,
                        })
                    "
                />
                <Button @click="($cloud.sync(), $emit('sync'))">
                    {{ $td('cloud.sync', 'Synchronize') }}
                </Button>
                <Button @click="$solid.logout()">
                    {{ $td('solid.logout', 'Logout') }}
                </Button>
            </div>
        </template>
    </AGSolidStatus>
</template>

<script setup lang="ts">
import { Button, Markdown } from '@aerogel/core';
import { AGSolidStatus } from '@aerogel/plugin-solid';
import type { IAGSolidStatusLoggedInSlotProps } from '@aerogel/plugin-solid';

defineEmits(['sync']);
</script>
