import type { Component } from 'vue';

export interface IAGErrorReportModalButtonsDefaultSlotProps {
    id: string;
    description: string;
    icon: Component;
    url?: string;
    handler?(): void;
}
