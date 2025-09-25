<template>
    <Modal :title="$td('settings.title', 'Settings')" :fullscreen-on-mobile="$app.settingsFullscreenOnMobile">
        <component :is="setting.component" v-for="(setting, key) in settings" :key />
    </Modal>
</template>

<script setup lang="ts">
import { arraySorted } from '@noeldemartin/utils';
import { computed } from 'vue';

import App from '@aerogel/core/services/App';
import Modal from '@aerogel/core/components/ui/Modal.vue';

const settings = computed(() => arraySorted(App.settings, 'priority', 'desc'));
</script>
