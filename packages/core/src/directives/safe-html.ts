import { safeHtml } from '@aerogel/core/utils';
import { defineDirective } from '@aerogel/core/utils/vue';

export type SafeHTMLDirectiveValue = string;

export default defineDirective<SafeHTMLDirectiveValue>({
    mounted(element: HTMLElement, { value }) {
        element.innerHTML = safeHtml(value);
    },
});
