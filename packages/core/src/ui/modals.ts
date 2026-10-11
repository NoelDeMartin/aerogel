import { after } from '@noeldemartin/utils';
import { injectModal, useModal as useModalBase } from '@noeldemartin/vue-modals';
import { inject, provide } from 'vue';
import type { InjectionKey } from 'vue';

export {
    createModal,
    showModal,
    injectModal,
    closeModal,
    modals,
    ModalComponent,
    ModalsPortal,
    type GetModalProps,
    type GetModalResponse,
    type ModalController,
} from '@noeldemartin/vue-modals';

const instances = new WeakSet();
const inlineModalsKey: InjectionKey<boolean> = Symbol('inlineModals');

/**
 * Renders descendant modals in place like regular components, instead of using a portal with an overlay (for example,
 * to showcase them in Storybook).
 */
export function provideInlineModals(): void {
    provide(inlineModalsKey, true);
}

export function injectInlineModals(): boolean {
    return inject(inlineModalsKey, false);
}

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function useModal<T = never>() {
    const instance = injectModal<T>();
    const { close, remove, ...modal } = useModalBase<T>(instances.has(instance) ? {} : { removeOnClose: false });

    instances.add(instance);

    return {
        ...modal,
        async close(result?: T): Promise<void> {
            void close(result);

            await after(1000);

            remove();
        },
    };
}
