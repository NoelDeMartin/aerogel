import { facade, fail, uuid } from '@noeldemartin/utils';
import { markRaw, nextTick } from 'vue';
import type { Component } from 'vue';
import type { ObjectValues } from '@noeldemartin/utils';

import Events from '@/services/Events';

import Service from './UI.state';
import type { Modal, ModalComponent } from './UI.state';

interface ModalCallbacks<T = unknown> {
    willClose(result: T | undefined): void;
    closed(result: T | undefined): void;
}

type ModalProperties<TComponent> = TComponent extends ModalComponent<infer TProperties, unknown> ? TProperties : never;
type ModalResult<TComponent> = TComponent extends ModalComponent<Record<string, unknown>, infer TResult>
    ? TResult
    : never;

export const UIComponents = {
    AlertModal: 'alert-modal',
} as const;

export type UIComponent = ObjectValues<typeof UIComponents>;

export class UIService extends Service {

    private modalCallbacks: Record<string, Partial<ModalCallbacks>> = {};
    private components: Partial<Record<UIComponent, Component>> = {};

    public alert(message: string): void {
        this.openModal(this.requireComponent(UIComponents.AlertModal), { message });
    }

    public registerComponent(name: UIComponent, component: Component): void {
        this.components[name] = component;
    }

    public async openModal<TModalComponent extends ModalComponent>(
        component: TModalComponent,
        properties?: ModalProperties<TModalComponent>,
    ): Promise<Modal<ModalResult<TModalComponent>>> {
        const id = uuid();
        const callbacks: Partial<ModalCallbacks<ModalResult<TModalComponent>>> = {};
        const modal: Modal<ModalResult<TModalComponent>> = {
            id,
            properties: properties ?? {},
            component: markRaw(component),
            beforeClose: new Promise((resolve) => (callbacks.willClose = resolve)),
            afterClose: new Promise((resolve) => (callbacks.closed = resolve)),
        };
        const activeModal = this.modals.at(-1);
        const modals = this.modals.concat(modal);

        this.modalCallbacks[modal.id] = callbacks;

        this.setState({ modals });

        await nextTick();
        await (activeModal && Events.emit('hide-modal', { id: activeModal.id }));
        await Promise.all([
            activeModal || Events.emit('show-overlays-backdrop'),
            Events.emit('show-modal', { id: modal.id }),
        ]);

        return modal;
    }

    public async closeModal(id: string, result?: unknown): Promise<void> {
        await Events.emit('close-modal', { id, result });
    }

    protected async boot(): Promise<void> {
        await super.boot();

        this.watchModalEvents();
    }

    private requireComponent(name: UIComponent): Component {
        return this.components[name] ?? fail(`UI Component '${name}' is not defined!`);
    }

    private watchModalEvents(): void {
        Events.on('modal-will-close', ({ modal, result }) => {
            this.modalCallbacks[modal.id]?.willClose?.(result);

            if (this.modals.length === 1) {
                Events.emit('hide-overlays-backdrop');
            }
        });

        Events.on('modal-closed', async ({ modal, result }) => {
            this.setState({ modals: this.modals.filter((m) => m.id !== modal.id) });

            this.modalCallbacks[modal.id]?.closed?.(result);

            delete this.modalCallbacks[modal.id];

            const activeModal = this.modals.at(-1);

            await (activeModal && Events.emit('show-modal', { id: activeModal.id }));
        });
    }

}

export default facade(new UIService());

declare module '@/services/Events' {
    export interface EventsPayload {
        'modal-will-close': { modal: Modal; result?: unknown };
        'modal-closed': { modal: Modal; result?: unknown };
        'close-modal': { id: string; result?: unknown };
        'hide-modal': { id: string };
        'show-modal': { id: string };
    }
}
