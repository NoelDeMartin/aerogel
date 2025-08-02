import type { Component } from 'vue';

import { defineServiceState } from '@aerogel/core/services/Service';

import { Layouts, getCurrentLayout } from './utils';

export interface UIToast {
    id: string;
    component: Component;
    properties: Record<string, unknown>;
}

export default defineServiceState({
    name: 'ui',
    initialState: {
        toasts: [] as UIToast[],
        layout: getCurrentLayout(),
    },
    computed: {
        desktop: ({ layout }) => layout === Layouts.Desktop,
        mobile: ({ layout }) => layout === Layouts.Mobile,
    },
});
