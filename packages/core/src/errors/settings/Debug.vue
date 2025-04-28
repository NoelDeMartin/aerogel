<template>
    <Setting
        title-id="debug-setting"
        :title="$td('settings.debug', 'Debugging')"
        :description="$td('settings.debugDescription', 'Enable debugging with [Eruda](https://eruda.liriliri.io/).')"
    >
        <Switch v-model="enabled" aria-labelledby="debug-setting" />
    </Setting>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type Eruda from 'eruda';

import Setting from '@aerogel/core/components/ui/Setting.vue';
import Switch from '@aerogel/core/components/ui/Switch.vue';

let eruda: typeof Eruda | null = null;
const enabled = ref(false);

watchEffect(async () => {
    if (!enabled.value) {
        eruda?.destroy();

        return;
    }

    eruda ??= (await import('eruda')).default;

    eruda.init();
});
</script>
