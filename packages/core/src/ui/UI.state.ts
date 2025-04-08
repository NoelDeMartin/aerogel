import type { Component } from 'vue';

import { defineServiceState } from '@aerogel/core/services/Service';

import { Layouts, getCurrentLayout } from './utils';

export interface UIModal<T = unknown> {
    id: string;
    properties: Record<string, unknown>;
    component: Component;
    beforeClose: Promise<T | undefined>;
    afterClose: Promise<T | undefined>;
}

export interface UIModalContext {
    modal: UIModal;
    childIndex?: number;
}

export interface ModalComponent<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Properties extends object = object,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Result = unknown,
> {}

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
        mobile: ({ layout }) => layout === Layouts.Mobile,
        desktop: ({ layout }) => layout === Layouts.Desktop,
    },
});
