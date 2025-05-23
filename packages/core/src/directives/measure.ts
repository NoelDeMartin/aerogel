import { defineDirective } from '@aerogel/core/utils/vue';
import { tap } from '@noeldemartin/utils';

const resizeObservers: WeakMap<HTMLElement, ResizeObserver> = new WeakMap();

export type MeasureDirectiveValue =
    | MeasureDirectiveListener
    | {
          css?: boolean;
          watch?: boolean;
      };

export type MeasureDirectiveModifiers = 'css' | 'watch';

export interface ElementSize {
    width: number;
    height: number;
}

export type MeasureDirectiveListener = (size: ElementSize) => unknown;

export default defineDirective<MeasureDirectiveValue, MeasureDirectiveModifiers>({
    mounted(element: HTMLElement, { value, modifiers }) {
        const listener = typeof value === 'function' ? (value as MeasureDirectiveListener) : null;
        const update = () => {
            const sizes = element.getBoundingClientRect();

            if (modifiers.css) {
                element.style.setProperty('--width', `${sizes.width}px`);
                element.style.setProperty('--height', `${sizes.height}px`);
            }

            listener?.({ width: sizes.width, height: sizes.height });
        };

        if (modifiers.watch) {
            resizeObservers.set(element, tap(new ResizeObserver(update)).observe(element));
        }

        update();
    },
    unmounted(element) {
        resizeObservers.get(element)?.unobserve(element);
        resizeObservers.delete(element);
    },
});
