import { defineDirective } from '@/utils/vue';

export default defineDirective({
    mounted(element: HTMLElement, { value }: { value?: () => unknown }) {
        const sizes = element.getBoundingClientRect();

        element.style.setProperty('--width', `${sizes.width}px`);
        element.style.setProperty('--height', `${sizes.height}px`);

        value?.();
    },
});
