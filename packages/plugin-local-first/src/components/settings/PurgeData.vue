<template>
    <Setting
        v-if="!$solid.hasLoggedIn()"
        title-id="purge-data-setting"
        :title-heading-level="4"
        :title="$td('settings.purgeData', 'Purge Data')"
        :description="
            $td(
                'settings.purgeDataDescription',
                'Wipe all database records and local storage from this device.',
            )
        "
    >
        <Button variant="secondary" @click="purgeData()" class="whitespace-nowrap">
            {{ $td('settings.purgeData', 'Purge Data') }}
        </Button>
    </Setting>
</template>

<script setup lang="ts">
import { Button, Setting, Storage, UI, translateWithDefault } from '@aerogel/core';

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
