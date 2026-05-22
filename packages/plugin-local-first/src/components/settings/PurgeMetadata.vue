<template>
    <Setting
        title-id="purge-metadata-setting"
        :title-heading-level="4"
        :title="$td('settings.purgeMetadata', 'Purge Metadata')"
        :description="
            $td(
                'settings.purgeMetadataDescription',
                'Clear local synchronization metadata to force redownloading all data (does not delete user data).'
            )
        "
    >
        <Button variant="secondary" @click="purgeMetadata()">
            {{ $td('settings.purgeMetadata', 'Purge Metadata') }}
        </Button>
    </Setting>
</template>

<script setup lang="ts">
import { Button, Setting, UI, translateWithDefault } from '@aerogel/core';
import { engineFulfillsContract, requireEngine } from 'soukai-bis';

async function purgeMetadata(): Promise<void> {
    const engine = requireEngine();

    if (!engineFulfillsContract(engine, 'PurgesMetadata')) {
        UI.toast(
            translateWithDefault(
                'settings.metadataCannotBePurged',
                'The current engine doesn\'t support purging metadata.',
            ),
        );

        return;
    }

    await engine.purgeMetadata();

    UI.toast(translateWithDefault('settings.metadataPurged', 'Metadata purged successfully!'));
}
</script>
