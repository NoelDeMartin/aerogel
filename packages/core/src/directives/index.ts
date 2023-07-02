import type { Directive } from 'vue';

import { definePlugin } from '@/plugins';

import initialFocus from './initial-focus';

const directives: Record<string, Directive> = {
    'initial-focus': initialFocus,
};

export default definePlugin({
    install(app) {
        Object.entries(directives).forEach(([name, directive]) => app.directive(name, directive));
    },
});
