import { after } from '@noeldemartin/utils';
import { useModal as useModalBase } from '@noeldemartin/vue-modals';

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useModal<T = never>() {
    const { close, remove, ...modal } = useModalBase<T>({ removeOnClose: false });

    return {
        ...modal,
        async close(result?: T) {
            close(result);

            await after(1000);

            remove();
        },
    };
}
