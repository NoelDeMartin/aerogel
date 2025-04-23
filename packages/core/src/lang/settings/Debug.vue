<template>
    <div class="mt-4 flex flex-row">
        <div class="flex-grow">
            <h3 id="debug-setting" class="text-base font-semibold">
                {{ $td('settings.debug', 'Debugging') }}
            </h3>
            <Markdown
                lang-key="settings.debugDescription"
                lang-default="Enable debugging with [Eruda](https://eruda.liriliri.io/)."
                class="mt-1 text-sm text-gray-500"
            />
        </div>

        <Switch v-model="enabled" aria-labelledby="debug-setting" />
    </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type Eruda from 'eruda';

import Switch from '@aerogel/core/components/ui/Switch.vue';
import Markdown from '@aerogel/core/components/ui/Markdown.vue';

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
