import { defineDirective } from '@/utils/vue';

export interface ElementSize {
    width: number;
    height: number;
}

export type MeasureDirectiveListener = (size: ElementSize) => unknown;

export default defineDirective({
    mounted(element: HTMLElement, { value }) {
        const listener = typeof value === 'function' ? (value as MeasureDirectiveListener) : null;
        const sizes = element.getBoundingClientRect();

        // TODO guard with modifiers.css once typed properly
        element.style.setProperty('--width', `${sizes.width}px`);
        element.style.setProperty('--height', `${sizes.height}px`);

        listener?.({ width: sizes.width, height: sizes.height });
    },
});
