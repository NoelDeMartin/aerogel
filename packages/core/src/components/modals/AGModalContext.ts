import type { Ref } from 'vue';

import type { UIModal } from '@/ui/UI.state';

export interface IAGModalContext {
    modal: Ref<UIModal>;
    childIndex: Ref<number>;
}
