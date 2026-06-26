<template>
    <Setting
        :title-heading-level="4"
        :title="$td('settings.clearCache', 'Clear Cache')"
        :description="
            $td(
                'settings.clearCacheDescription',
                'Clear caches to force re-downloading all data (does not delete user data).'
            )
        "
    >
        <Button variant="secondary" @click="clearCache()" class="whitespace-nowrap">
            {{ $td('settings.clearCache', 'Clear Cache') }}
        </Button>
    </Setting>
</template>

<script setup lang="ts">
import { Button, Setting, UI, translateWithDefault } from '@aerogel/core';
import { ComputedAttributesCache, engineFulfillsContract, requireEngine } from 'soukai-bis';

async function clearCache(): Promise<void> {
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

    await Promise.all([engine.purgeMetadata(), ComputedAttributesCache.clear()]);

    UI.toast(translateWithDefault('settings.cacheCleared', 'Cache cleared successfully!'));
}
</script>
