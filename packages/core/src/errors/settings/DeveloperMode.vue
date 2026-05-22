<template>
    <div>
        <Setting
            title-id="developer-mode-setting"
            :title="$td('settings.developerMode', 'Developer Mode')"
            :description="
                $td(
                    'settings.developerModeDescription',
                    'Enable developer mode to access advanced options and actions.',
                )
            "
        >
            <Switch v-model="$app.devMode" aria-labelledby="developer-mode-setting" />
        </Setting>

        <template v-if="$app.devMode">
            <Setting
                title-id="debug-setting"
                :title-heading-level="4"
                :title="$td('settings.debug', 'Debugging')"
                :description="
                    $td(
                        'settings.debugDescription',
                        'Enable debugging with [Eruda](https://eruda.liriliri.io/).',
                    )
                "
            >
                <Switch v-model="$errors.debug" aria-labelledby="debug-setting" />
            </Setting>
        </template>
    </div>
</template>

<script setup lang="ts">
import Setting from '@aerogel/core/components/ui/Setting.vue';
import Switch from '@aerogel/core/components/ui/Switch.vue';
</script>
