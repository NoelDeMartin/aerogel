import { getCurrentInstance } from 'vue';
import { useForwardExpose as useRekaForwardExpose } from 'reka-ui';
import type { ComponentPublicInstance, ComputedRef, Ref } from 'vue';
import { required } from '@noeldemartin/utils';
import type { Nullable } from '@noeldemartin/utils';

export interface ForwardExpose<T extends object> {
    forwardRef: (ref: Element | ComponentPublicInstance | null) => void;
    currentRef: Ref<Nullable<T>>;
    currentElement: ComputedRef<Nullable<HTMLElement>>;
}

/**
 * Wrapper around Reka UI's `useForwardExpose` that fixes its types. Use it in every component that forwards the
 * exposed API of its root component, instead of importing `useForwardExpose` from Reka UI directly.
 *
 * Reka UI's `useForwardExpose` forwards the child's exposed API by replacing `instance.exposed` at runtime, but
 * TypeScript can't see that. Vue infers a component's exposed type only from `defineExpose`. So components must
 * also declare the forwarded API with a type-only `defineExpose<T>()`, and it must come before this call:
 * `defineExpose()` replaces `instance.exposed`, so calling it afterwards would discard the forwarded API. In
 * development, Vue warns with "expose() should be called only once per setup()" when that happens.
 *
 * @example
 * defineExpose<FormControlExpose>();
 * const { forwardRef, currentRef: $control } = useForwardExpose<InstanceType<typeof HeadlessFormControl>>();
 *
 * This wrapper also fixes three types from Reka UI:
 * - `currentRef` is typed as `Element | T | null`, and `T` must extend `ComponentPublicInstance`, which components
 *   with typed emits don't. Here it's typed as the child instance, so it can be read without casts.
 * - `currentElement` is typed as `HTMLElement`, but it's empty until the ref is forwarded, or if the child renders no
 *   element (see https://github.com/unovue/reka-ui/issues/2804).
 * - `forwardRef` only accepts `T`, so `:ref="forwardRef"` doesn't type-check in templates with a typed `T`.
 *   Here it accepts any template ref.
 *
 * It also fixes two runtime issues from Reka UI:
 * - The API exposed by a child that also forwards its root (i.e. has its own `$el`) is not forwarded, so nested
 *   forwarding doesn't work.
 * - When the child's API is forwarded, the exposed props are copied with their values at that moment, so they don't
 *   reflect later changes.
 *
 * The declared `defineExpose` type isn't checked against what the child actually exposes. Headless components
 * enforce their contracts with `satisfies` instead.
 */
export function useForwardExpose<
    T extends object = ComponentPublicInstance,
>(): ForwardExpose<T> {
    const instance = required(getCurrentInstance(), 'useForwardExpose must be called inside setup()');
    const { forwardRef: rekaForwardRef, currentRef, currentElement } = useRekaForwardExpose();
    const localExposed = instance.exposed;

    return {
        currentElement,
        currentRef: currentRef as Ref<Nullable<T>>,
        forwardRef(ref) {
            rekaForwardRef(ref as ComponentPublicInstance);

            if (!ref || ref instanceof Element) {
                return;
            }

            const child = ref.$;
            const exposed = Object.defineProperties({}, Object.getOwnPropertyDescriptors(localExposed));

            for (const key in child.exposed) {
                Object.defineProperty(exposed, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => child.exposed?.[key],
                });
            }

            instance.exposed = exposed;
        },
    };
}
