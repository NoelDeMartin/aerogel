<template>
    <Setting
        title-id="debug-setting"
        :title="$td('settings.debug', 'Debugging')"
        :description="$td('settings.debugDescription', 'Enable debugging with [Eruda](https://eruda.liriliri.io/).')"
    >
        <Switch v-model="$errors.debug" aria-labelledby="debug-setting" />
    </Setting>
</template>

<script setup lang="ts">
import Setting from '@aerogel/core/components/ui/Setting.vue';
import Switch from '@aerogel/core/components/ui/Switch.vue';
</script>
