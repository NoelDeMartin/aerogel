<template>
    <div class="relative size-12">
        <button
            class="clickable focus-visible:outline-primary-600 flex size-full rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            type="button"
            :aria-label="$td('account.open', 'Open account')"
            :title="$td('account.open', 'Open account')"
            @click="$ui.modal(AccountModal)"
        >
            <SolidAvatar class="size-full" />
            <div
                v-if="accountStatus.loading"
                class="absolute -inset-1 animate-spin rounded-full border-2 border-[currentColor_transparent] text-green-500"
            />
        </button>
        <div
            class="pointer-events-none absolute right-0 bottom-0 size-3 rounded-full border-2 border-white"
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

import Cloud from '@aerogel/plugin-local-first/services/Cloud';
import { CloudStatus } from '@aerogel/plugin-local-first/services/Cloud.state';

import AccountModal from './AccountModal.vue';

interface AccountStatus {
    classes: string;
    message: string;
    loading?: boolean;
}

const accountStatus = computed((): AccountStatus => {
    if (Cloud.syncing || Solid.loginOngoing) {
        return {
            loading: true,
            classes: 'bg-green-500 sr-only',
            message: getAccountStatusMessage() ?? '',
        };
    }

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

    return {
        classes: 'bg-green-500',
        message: getAccountStatusMessage() ?? '',
    };
});

function getAccountStatusMessage(): string | undefined {
    switch (Cloud.status) {
        case CloudStatus.Syncing:
            return translateWithDefault('cloud.status.syncing', 'Synchronization in progress');
        case CloudStatus.Migrating:
            return translateWithDefault('cloud.status.migrating', 'Migration in progress');
        case CloudStatus.Online:
            return translateWithDefault('cloud.status.online', 'Online');
        case CloudStatus.Disconnected:
            return translateWithDefault('cloud.status.disconnected', 'Disconnected');
    }
}
</script>
