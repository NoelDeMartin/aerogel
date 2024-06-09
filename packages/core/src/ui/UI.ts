import { after, facade, fail, uuid } from '@noeldemartin/utils';
import { markRaw, nextTick } from 'vue';
import type { Component } from 'vue';
import type { ObjectValues } from '@noeldemartin/utils';

import Events from '@/services/Events';
import type { Color } from '@/components/constants';
import type { SnackbarAction, SnackbarColor } from '@/components/headless/snackbars';
import type { AGAlertModalProps, AGConfirmModalProps, AGLoadingModalProps, AGPromptModalProps } from '@/components';

import Service from './UI.state';
import type { Modal, ModalComponent, Snackbar } from './UI.state';

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
    ConfirmModal: 'confirm-modal',
    ErrorReportModal: 'error-report-modal',
    LoadingModal: 'loading-modal',
    PromptModal: 'prompt-modal',
    Snackbar: 'snackbar',
    StartupCrash: 'startup-crash',
} as const;

export type UIComponent = ObjectValues<typeof UIComponents>;

export interface ConfirmOptions {
    acceptText?: string;
    acceptColor?: Color;
    cancelText?: string;
    cancelColor?: Color;
}

export interface PromptOptions {
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    acceptText?: string;
    acceptColor?: Color;
    cancelText?: string;
    cancelColor?: Color;
    trim?: boolean;
}

export interface ShowSnackbarOptions {
    component?: Component;
    color?: SnackbarColor;
    actions?: SnackbarAction[];
}

export class UIService extends Service {

    private modalCallbacks: Record<string, Partial<ModalCallbacks>> = {};
    private components: Partial<Record<UIComponent, Component>> = {};

    public requireComponent(name: UIComponent): Component {
        return this.components[name] ?? fail(`UI Component '${name}' is not defined!`);
    }

    public alert(message: string): void;
    public alert(title: string, message: string): void;
    public alert(messageOrTitle: string, message?: string): void {
        const getProperties = (): AGAlertModalProps => {
            if (typeof message !== 'string') {
                return { message: messageOrTitle };
            }

            return {
                title: messageOrTitle,
                message,
            };
        };

        this.openModal(this.requireComponent(UIComponents.AlertModal), getProperties());
    }

    public async confirm(message: string, options?: ConfirmOptions): Promise<boolean>;
    public async confirm(title: string, message: string, options?: ConfirmOptions): Promise<boolean>;
    public async confirm(
        messageOrTitle: string,
        messageOrOptions?: string | ConfirmOptions,
        options?: ConfirmOptions,
    ): Promise<boolean> {
        const getProperties = (): AGConfirmModalProps => {
            if (typeof messageOrOptions !== 'string') {
                return {
                    message: messageOrTitle,
                    ...(messageOrOptions ?? {}),
                };
            }

            return {
                title: messageOrTitle,
                message: messageOrOptions,
                ...(options ?? {}),
            };
        };

        const modal = await this.openModal<ModalComponent<AGConfirmModalProps, boolean>>(
            this.requireComponent(UIComponents.ConfirmModal),
            getProperties(),
        );
        const result = await modal.beforeClose;

        return result ?? false;
    }

    public async prompt(message: string, options?: PromptOptions): Promise<string | null>;
    public async prompt(title: string, message: string, options?: PromptOptions): Promise<string | null>;
    public async prompt(
        messageOrTitle: string,
        messageOrOptions?: string | PromptOptions,
        options?: PromptOptions,
    ): Promise<string | null> {
        const trim = options?.trim ?? true;
        const getProperties = (): AGPromptModalProps => {
            if (typeof messageOrOptions !== 'string') {
                return {
                    message: messageOrTitle,
                    ...(messageOrOptions ?? {}),
                };
            }

            return {
                title: messageOrTitle,
                message: messageOrOptions,
                ...(options ?? {}),
            };
        };

        const modal = await this.openModal<ModalComponent<AGPromptModalProps, string | null>>(
            this.requireComponent(UIComponents.PromptModal),
            getProperties(),
        );
        const rawResult = await modal.beforeClose;
        const result = trim ? rawResult?.trim() : rawResult;

        return result ?? null;
    }

    public async loading<T>(operation: Promise<T>): Promise<T>;
    public async loading<T>(message: string, operation: Promise<T>): Promise<T>;
    public async loading<T>(messageOrOperation: string | Promise<T>, operation?: Promise<T>): Promise<T> {
        const getProperties = (): AGLoadingModalProps => {
            if (typeof messageOrOperation !== 'string') {
                return {};
            }

            return { message: messageOrOperation };
        };

        const modal = await this.openModal(this.requireComponent(UIComponents.LoadingModal), getProperties());

        try {
            operation = typeof messageOrOperation === 'string' ? (operation as Promise<T>) : messageOrOperation;

            const [result] = await Promise.all([operation, after({ seconds: 1 })]);

            return result;
        } finally {
            await this.closeModal(modal.id);
        }
    }

    public showSnackbar(message: string, options: ShowSnackbarOptions = {}): void {
        const snackbar: Snackbar = {
            id: uuid(),
            properties: { message, ...options },
            component: markRaw(options.component ?? this.requireComponent(UIComponents.Snackbar)),
        };

        this.setState('snackbars', this.snackbars.concat(snackbar));

        setTimeout(() => this.hideSnackbar(snackbar.id), 5000);
    }

    public hideSnackbar(id: string): void {
        this.setState(
            'snackbars',
            this.snackbars.filter((snackbar) => snackbar.id !== id),
        );
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
        this.watchModalEvents();
        this.watchMountedEvent();
    }

    private watchModalEvents(): void {
        Events.on('modal-will-close', ({ modal, result }) => {
            this.modalCallbacks[modal.id]?.willClose?.(result);

            if (this.modals.length === 1) {
                Events.emit('hide-overlays-backdrop');
            }
        });

        Events.on('modal-closed', async ({ modal, result }) => {
            this.setState(
                'modals',
                this.modals.filter((m) => m.id !== modal.id),
            );

            this.modalCallbacks[modal.id]?.closed?.(result);

            delete this.modalCallbacks[modal.id];

            const activeModal = this.modals.at(-1);

            await (activeModal && Events.emit('show-modal', { id: activeModal.id }));
        });
    }

    private watchMountedEvent(): void {
        Events.once('application-mounted', async () => {
            const splash = document.getElementById('splash');

            if (!splash) {
                return;
            }

            if (window.getComputedStyle(splash).opacity !== '0') {
                splash.style.opacity = '0';

                await after({ ms: 600 });
            }

            splash.remove();
        });
    }

}

export default facade(UIService);

declare module '@/services/Events' {
    export interface EventsPayload {
        'close-modal': { id: string; result?: unknown };
        'hide-modal': { id: string };
        'hide-overlays-backdrop': void;
        'modal-closed': { modal: Modal; result?: unknown };
        'modal-will-close': { modal: Modal; result?: unknown };
        'show-modal': { id: string };
        'show-overlays-backdrop': void;
    }
}
