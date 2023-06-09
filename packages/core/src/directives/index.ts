import type { Directive } from 'vue';

import initialFocus from './initial-focus';

const directives: Record<string, Directive> = {
    'initial-focus': initialFocus,
};

export default directives;
