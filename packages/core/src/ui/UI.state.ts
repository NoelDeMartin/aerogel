import type { Component } from 'vue';

import { defineServiceState } from '@/services/Service';

export interface Modal<T = unknown> {
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

export default defineServiceState({
    initialState: { modals: [] as Modal[] },
});
