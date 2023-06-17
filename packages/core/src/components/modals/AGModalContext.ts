import type { Ref } from 'vue';

import type { Modal } from '@/services/UI.state';

export interface IAGModalContext {
    modal: Ref<Modal>;
    childIndex: Ref<number>;
}
