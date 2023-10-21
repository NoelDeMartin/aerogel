import type { Directive } from 'vue';

import { definePlugin } from '@/plugins';

import initialFocus from './initial-focus';

const builtInDirectives: Record<string, Directive> = {
    'initial-focus': initialFocus,
};

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
    interface AerogelOptions {
        directives?: Record<string, Directive>;
    }
}
