import '@aerogel/histoire/dist/main.css';
import { defineSetupAerogel } from '@aerogel/histoire';
import { UI, UIComponents } from '@aerogel/core';

import AlertModal from './components/modals/AlertModal.vue';

import './assets/css/main.css';

export const setupVue3 = defineSetupAerogel({
    messages: import.meta.glob('@/lang/*.yaml'),
    setup() {
        UI.registerComponent(UIComponents.AlertModal, AlertModal);
    },
});
