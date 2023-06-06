import type { IAGModal } from '@/components/AGModal';

export interface IAGHeadlessModal extends IAGModal {}

export interface IAGHeadlessModalDefaultSlotProps {
    close(result?: unknown): Promise<void>;
}
