import { PromisedValue, after } from '@noeldemartin/utils';
import { injectModal, modals, useModal as useModalBase } from '@noeldemartin/vue-modals';
import type { ModalController } from '@noeldemartin/vue-modals';
import { watch } from 'vue';

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
    type ModalMetadata,
    type ModalOptions,
} from '@noeldemartin/vue-modals';

const instances = new WeakSet();

function isLastModal(controller: ModalController<unknown>): boolean {
    const index = modals.value.indexOf(controller as ModalController);

    return index === -1 || index === modals.value.length - 1;
}

function waitUntilLastModal(controller: ModalController<unknown>): Promise<void> {
    if (isLastModal(controller)) {
        return Promise.resolve();
    }

    const becameLast = new PromisedValue<void>();
    const stop = watch(modals, () => {
        if (!isLastModal(controller)) {
            return;
        }

        stop();
        becameLast.resolve();
    });

    return becameLast;
}

export const MODAL_CLOSE_ANIMATION_DURATION = 500;

// oxlint-disable-next-line typescript/explicit-module-boundary-types
export function useModal<T = never>() {
    const instance = injectModal<T>();
    // oxlint-disable-next-line no-unused-vars
    const { close, remove, ...modal } = useModalBase<T>(instances.has(instance) ? {} : { removeOnClose: false });

    instances.add(instance);

    return {
        ...modal,
        async close(result?: T): Promise<void> {
            const controller = instance.value;

            void close(result);

            await after(MODAL_CLOSE_ANIMATION_DURATION);

            void waitUntilLastModal(controller).then(() => controller.remove());
        },
    };
}

declare module '@noeldemartin/vue-modals' {
    interface ModalMetadata {
        inline?: boolean;
    }
}
