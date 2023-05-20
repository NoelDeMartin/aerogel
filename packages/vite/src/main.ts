import '@total-typescript/ts-reset';
import Vue from '@vitejs/plugin-vue';
import type { ComponentResolver } from 'unplugin-vue-components';
import type { Plugin } from 'vite';

export function AerogelResolver(): ComponentResolver {
    return {
        type: 'component',
        resolve: (name) => {
            if (!name.startsWith('AG')) {
                return;
            }

            return { name, as: name, from: '@aerogel/core' };
        },
    };
}

export default function Aerogel(): Plugin[] {
    return [Vue()];
}
