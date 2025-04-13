import type { Component } from 'vue';

import { defineServiceState } from '@aerogel/core/services/Service';

import { Layouts, getCurrentLayout } from './utils';

export interface UIModal<T = unknown> {
    id: string;
    properties: Record<string, unknown>;
    component: Component;
    closing: boolean;
    beforeClose: Promise<T | undefined>;
    afterClose: Promise<T | undefined>;
}

export interface UIToast {
    id: string;
    component: Component;
    properties: Record<string, unknown>;
}

export default defineServiceState({
    name: 'ui',
    initialState: {
        modals: [] as UIModal[],
        toasts: [] as UIToast[],
        layout: getCurrentLayout(),
    },
    computed: {
        desktop: ({ layout }) => layout === Layouts.Desktop,
        mobile: ({ layout }) => layout === Layouts.Mobile,
        openModals: ({ modals }) => modals.filter(({ closing }) => !closing),
    },
});
