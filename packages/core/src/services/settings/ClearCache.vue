<template>
    <Setting
        :title-heading-level="4"
        :title="$td('settings.clearCache', 'Clear Cache')"
        :description="
            $td(
                'settings.clearCacheDescription',
                'Clear caches to force re-downloading all data (does not delete user data).',
            )
        "
    >
        <Button variant="secondary" class="whitespace-nowrap" :loading @click="clearCache()">
            {{
                loading ? $td('settings.clearingCache', 'Clearing cache...') : $td('settings.clearCache', 'Clear Cache')
            }}
        </Button>
    </Setting>
</template>

<script setup lang="ts">
import Button from '@aerogel/core/components/ui/Button.vue';
import Setting from '@aerogel/core/components/ui/Setting.vue';
import { translateWithDefault } from '@aerogel/core/lang/utils';
import Cache from '@aerogel/core/services/Cache';
import UI from '@aerogel/core/ui/UI';
import { useLoading } from '@aerogel/core/utils/composition/loading';

const { loading, run } = useLoading();

async function clearCache(): Promise<void> {
    await run(Cache.clear());

    UI.toast(translateWithDefault('settings.cacheCleared', 'Cache cleared successfully!'));
}
</script>
