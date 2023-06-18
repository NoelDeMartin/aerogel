import type { Ref } from 'vue';

import type { Modal } from '@/ui/UI.state';

export interface IAGModalContext {
    modal: Ref<Modal>;
    childIndex: Ref<number>;
}
