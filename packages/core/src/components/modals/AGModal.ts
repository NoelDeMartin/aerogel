import type { Ref } from 'vue';

export interface IAGModal {
    cancellable: Ref<boolean>;
    close(): Promise<void>;
}
