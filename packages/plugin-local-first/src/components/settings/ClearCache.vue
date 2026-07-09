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
        <Button
            variant="secondary"
            class="whitespace-nowrap"
            :loading
            @click="clearCache()"
        >
            {{
                loading ? $td('settings.clearingCache', 'Clearing cache...') : $td('settings.clearCache', 'Clear Cache')
            }}
        </Button>
    </Setting>
</template>

<script setup lang="ts">
import { Button, Setting, UI, translateWithDefault, useLoading } from '@aerogel/core';
import { ComputedAttributesCache, engineFulfillsContract, requireEngine } from 'soukai-bis';

const { loading, run } = useLoading();

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

    await run(engine.purgeMetadata(), ComputedAttributesCache.clear());

    UI.toast(translateWithDefault('settings.cacheCleared', 'Cache cleared successfully!'));
}
</script>
