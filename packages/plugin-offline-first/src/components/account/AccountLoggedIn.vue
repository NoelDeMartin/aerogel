<template>
    <div class="relative h-12 w-12">
        <button
            class="clickable-target flex h-full w-full rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[--primary-600]"
            type="button"
            :aria-label="$td('account.open', 'Open account')"
            :title="$td('account.open', 'Open account')"
            @click="$ui.openModal(AccountModal)"
        >
            <SolidAvatar class="h-full w-full" />
            <div
                v-if="accountStatus.loading"
                class="absolute -inset-1 animate-spin rounded-full border-2 border-[currentColor_transparent] text-green-500"
            />
        </button>
        <div
            class="pointer-events-none absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
            :class="accountStatus.classes"
        >
            <span class="sr-only">{{ accountStatus.message }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Solid, SolidAvatar } from '@aerogel/plugin-solid';
import { translateWithDefault } from '@aerogel/core';

import Cloud from '@/services/Cloud';
import { CloudStatus } from '@/services/Cloud.state';

import AccountModal from './AccountModal.vue';

interface AccountStatus {
    classes: string;
    message: string;
    loading?: boolean;
}

const accountStatus = computed((): AccountStatus => {
    if (Solid.error || Cloud.syncError) {
        return {
            classes: 'bg-red-500',
            message: translateWithDefault('account.error', 'There has been an error connecting with your account.'),
        };
    }

    if (!Solid.isLoggedIn() || Cloud.dirty || !Cloud.ready) {
        return {
            classes: 'bg-yellow-500',
            message: translateWithDefault(
                'account.dirty',
                'There are local changes that haven\'t been synchronized yet.',
            ),
        };
    }

    Cloud.status;
    return {
        classes: 'bg-green-500',
        message: getAccountStatusMessage() ?? '',
    };
});

function getAccountStatusMessage(): string | undefined {
    switch (Cloud.status) {
        case CloudStatus.Syncing:
            return 'Syncing in progress';
        case CloudStatus.Migrating:
            return 'Migration in progress';
        case CloudStatus.Online:
            return 'Online';
        case CloudStatus.Disconnected:
            return 'Disconnected';
    }
}
</script>
