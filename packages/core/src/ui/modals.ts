import { after } from '@noeldemartin/utils';
import { injectModal, useModal as useModalBase } from '@noeldemartin/vue-modals';

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useModal<T = never>() {
    const instance = injectModal<T>();
    const { close, remove, ...modal } = useModalBase<T>(instances.has(instance) ? {} : { removeOnClose: false });

    instances.add(instance);

    return {
        ...modal,
        async close(result?: T) {
            close(result);

            await after(1000);

            remove();
        },
    };
}
