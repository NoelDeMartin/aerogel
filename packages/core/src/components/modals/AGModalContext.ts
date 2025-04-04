import type { Ref } from 'vue';

import type { UIModal } from '@aerogel/core/ui/UI.state';

export interface IAGModalContext {
    modal: Ref<UIModal>;
    childIndex: Ref<number>;
}
