import type { Ref } from 'vue';

export interface IAGModal {
    inline: Ref<boolean>;
    cancellable: Ref<boolean>;
    close(result?: unknown): Promise<void>;
}

export interface IAGModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}
