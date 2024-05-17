import type { Directive } from 'vue';

import { definePlugin } from '@/plugins';

import initialFocus from './initial-focus';
import measure from './measure';

const builtInDirectives: Record<string, Directive> = {
    'initial-focus': initialFocus,
    'measure': measure,
};

export * from './measure';

export default definePlugin({
    install(app, options) {
        const directives = {
            ...builtInDirectives,
            ...options.directives,
        };

        for (const [name, directive] of Object.entries(directives)) {
            app.directive(name, directive);
        }
    },
});

declare module '@/bootstrap/options' {
    export interface AerogelOptions {
        directives?: Record<string, Directive>;
    }
}
