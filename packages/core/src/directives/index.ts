import type { Directive } from 'vue';

import { defineBootstrapHook } from '@/bootstrap/hooks';

import initialFocus from './initial-focus';

const directives: Record<string, Directive> = {
    'initial-focus': initialFocus,
};

export default defineBootstrapHook(async (app) => {
    Object.entries(directives).forEach(([name, directive]) => app.directive(name, directive));
});
