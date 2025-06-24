import type { Directive } from 'vue';

import { definePlugin } from '@aerogel/core/plugins';

import measure from './measure';
import safeHtml from './safe-html';

export const aerogelDirectives = {
    'measure': measure,
    'safe-html': safeHtml,
} as const satisfies Record<string, Directive>;

export type AerogelDirectives = typeof aerogelDirectives;

export * from './measure';

export default definePlugin({
    install(app, options) {
        const directives = {
            ...aerogelDirectives,
            ...options.directives,
        };

        for (const [name, directive] of Object.entries(directives)) {
            app.directive(name, directive as Directive);
        }
    },
});

declare module '@aerogel/core/bootstrap/options' {
    export interface AerogelOptions {
        directives?: Record<string, Directive>;
    }
}

declare module 'vue' {
    interface ComponentCustomDirectives extends AerogelDirectives {}
}
