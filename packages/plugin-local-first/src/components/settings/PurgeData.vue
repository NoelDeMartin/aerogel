<template>
    <details v-if="!$solid.hasLoggedIn()" class="mt-4">
        <summary>
            <span class="text-base font-semibold">{{ $td('settings.dangerZone', 'Danger zone') }}</span>
        </summary>
        <Button variant="danger" class="mt-4" @click="purgeData()">
            <IconTrash class="size-4" />
            <span class="ml-1">{{ $td('settings.purge', 'Purge data') }}</span>
        </Button>
    </details>
</template>

<script setup lang="ts">
import IconTrash from '~icons/zondicons/trash';

import { Button, Storage, UI, translateWithDefault } from '@aerogel/core';

import AccountLoginModal from '@aerogel/plugin-local-first/components/AccountLoginModal.vue';

async function purgeData(): Promise<void> {
    const confirmed = await UI.confirm(
        translateWithDefault('settings.purgeConfirmTitle', 'Delete everything?'),
        translateWithDefault(
            'settings.purgeConfirmMessage',
            'If you proceed, all your data will be deleted forever. ' +
                'If you want to save it before wiping this device, ' +
                'you can [connect to your Solid account](#action:connect) first.',
        ),
        {
            acceptVariant: 'danger',
            acceptText: translateWithDefault('settings.purgeConfirmAccept', 'Purge data'),
            actions: { connect: () => UI.modal(AccountLoginModal) },
        },
    );

    if (!confirmed) {
        return;
    }

    await UI.closeAllModals();
    await Storage.purge();
}
</script>
