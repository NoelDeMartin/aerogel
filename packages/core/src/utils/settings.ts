import type { Component } from 'vue';

export interface AppSetting {
    component: Component;
    priority: number;
    development?: boolean;
}

export function defineSettings<T extends AppSetting[]>(settings: T): T {
    return settings;
}
