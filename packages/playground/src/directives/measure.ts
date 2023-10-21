import { defineDirective } from '@aerogel/core';

export default defineDirective({
    mounted(element: HTMLElement, { value }: { value: () => unknown }) {
        const width = element.getBoundingClientRect().width;

        element.style.setProperty('--width', `${width}px`);

        value();
    },
});
