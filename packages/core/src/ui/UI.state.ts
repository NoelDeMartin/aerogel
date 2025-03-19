import type { Component } from 'vue';

import { defineServiceState } from '@/services/Service';

import { Layouts, getCurrentLayout } from './utils';

export interface UIModal<T = unknown> {
    id: string;
    properties: Record<string, unknown>;
    component: Component;
    beforeClose: Promise<T | undefined>;
    afterClose: Promise<T | undefined>;
}

export interface ModalComponent<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Properties extends Record<string, unknown> = Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Result = unknown
> {}

export interface UISnackbar {
    id: string;
    component: Component;
    properties: Record<string, unknown>;
}

export default defineServiceState({
    name: 'ui',
    initialState: {
        modals: [] as UIModal[],
        snackbars: [] as UISnackbar[],
        layout: getCurrentLayout(),
    },
    computed: {
        mobile: ({ layout }) => layout === Layouts.Mobile,
        desktop: ({ layout }) => layout === Layouts.Desktop,
    },
});
