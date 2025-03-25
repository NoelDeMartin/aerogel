import type { Ref } from 'vue';

import type { Modal } from '@aerogel/core/ui/UI.state';

export interface IAGModalContext {
    modal: Ref<Modal>;
    childIndex: Ref<number>;
}
