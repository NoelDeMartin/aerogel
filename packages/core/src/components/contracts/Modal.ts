import type { Ref } from 'vue';

export interface IModal {
    inline: Ref<boolean>;
    cancellable: Ref<boolean>;
    close(result?: unknown): Promise<void>;
}

export interface IModalProps {
    cancellable: boolean;
    inline: boolean;
    title: string | null;
    description: string | null;
}

export interface IModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}
