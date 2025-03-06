import { after, facade, fail, required, uuid } from '@noeldemartin/utils';
import { markRaw, nextTick } from 'vue';
import type { Component } from 'vue';
import type { ObjectValues } from '@noeldemartin/utils';

import App from '@/services/App';
import Events from '@/services/Events';
import type { AcceptRefs } from '@/utils';
import type { Color } from '@/components/constants';
import type { SnackbarAction, SnackbarColor } from '@/components/headless/snackbars';
import type { AGAlertModalProps, AGConfirmModalProps, AGLoadingModalProps, AGPromptModalProps } from '@/components';

import Service from './UI.state';
import { MOBILE_BREAKPOINT, getCurrentLayout } from './utils';
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

export type ConfirmCheckboxes = Record<string, { label: string; default?: boolean; required?: boolean }>;

export type ConfirmOptions = AcceptRefs<{
    acceptText?: string;
    acceptColor?: Color;
    cancelText?: string;
    cancelColor?: Color;
    actions?: Record<string, () => unknown>;
    required?: boolean;
}>;

export type LoadingOptions = AcceptRefs<{
    title?: string;
    message?: string;
    progress?: number;
}>;

export interface ConfirmOptionsWithCheckboxes<T extends ConfirmCheckboxes = ConfirmCheckboxes> extends ConfirmOptions {
    checkboxes?: T;
}

export type PromptOptions = AcceptRefs<{
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    acceptText?: string;
    acceptColor?: Color;
    cancelText?: string;
    cancelColor?: Color;
    trim?: boolean;
}>;

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

    /* eslint-disable max-len */
    public async confirm(message: string, options?: ConfirmOptions): Promise<boolean>;
    public async confirm(title: string, message: string, options?: ConfirmOptions): Promise<boolean>;
    public async confirm<T extends ConfirmCheckboxes>(message: string, options?: ConfirmOptionsWithCheckboxes<T>): Promise<[boolean, Record<keyof T, boolean>]>; // prettier-ignore
    public async confirm<T extends ConfirmCheckboxes>(title: string, message: string, options?: ConfirmOptionsWithCheckboxes<T>): Promise<[boolean, Record<keyof T, boolean>]>; // prettier-ignore
    /* eslint-enable max-len */

    public async confirm(
        messageOrTitle: string,
        messageOrOptions?: string | ConfirmOptions | ConfirmOptionsWithCheckboxes,
        options?: ConfirmOptions | ConfirmOptionsWithCheckboxes,
    ): Promise<boolean | [boolean, Record<string, boolean>]> {
        const getProperties = (): AGConfirmModalProps => {
            if (typeof messageOrOptions !== 'string') {
                return {
                    ...(messageOrOptions ?? {}),
                    message: messageOrTitle,
                    required: !!messageOrOptions?.required,
                };
            }

            return {
                ...(options ?? {}),
                title: messageOrTitle,
                message: messageOrOptions,
                required: !!options?.required,
            };
        };
        const properties = getProperties();
        const modal = await this.openModal<
            ModalComponent<AGConfirmModalProps, boolean | [boolean, Record<string, boolean>]>
        >(this.requireComponent(UIComponents.ConfirmModal), properties);
        const result = await modal.beforeClose;

        const confirmed = typeof result === 'object' ? result[0] : result ?? false;
        const checkboxes =
            typeof result === 'object'
                ? result[1]
                : Object.entries(properties.checkboxes ?? {}).reduce(
                    (values, [checkbox, { default: defaultValue }]) => ({
                        [checkbox]: defaultValue ?? false,
                        ...values,
                    }),
                      {} as Record<string, boolean>,
                );

        for (const [name, checkbox] of Object.entries(properties.checkboxes ?? {})) {
            if (!checkbox.required || checkboxes[name]) {
                continue;
            }

            if (confirmed && App.development) {
                // eslint-disable-next-line no-console
                console.warn(`Confirmed confirm modal was suppressed because required '${name}' checkbox was missing`);
            }

            return [false, checkboxes];
        }

        return 'checkboxes' in properties ? [confirmed, checkboxes] : confirmed;
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
                } as AGPromptModalProps;
            }

            return {
                title: messageOrTitle,
                message: messageOrOptions,
                ...(options ?? {}),
            } as AGPromptModalProps;
        };

        const modal = await this.openModal<ModalComponent<AGPromptModalProps, string | null>>(
            this.requireComponent(UIComponents.PromptModal),
            getProperties(),
        );
        const rawResult = await modal.beforeClose;
        const result = trim && typeof rawResult === 'string' ? rawResult?.trim() : rawResult;

        return result ?? null;
    }

    public async loading<T>(operation: Promise<T> | (() => T)): Promise<T>;
    public async loading<T>(message: string, operation: Promise<T> | (() => T)): Promise<T>;
    public async loading<T>(options: LoadingOptions, operation: Promise<T> | (() => T)): Promise<T>;
    public async loading<T>(
        operationOrMessageOrOptions: string | LoadingOptions | Promise<T> | (() => T),
        operation?: Promise<T> | (() => T),
    ): Promise<T> {
        const processOperation = (o: Promise<T> | (() => T)) => (typeof o === 'function' ? Promise.resolve(o()) : o);
        const processArgs = (): { operationPromise: Promise<T>; props?: AGLoadingModalProps } => {
            if (typeof operationOrMessageOrOptions === 'string') {
                return {
                    props: { message: operationOrMessageOrOptions },
                    operationPromise: processOperation(operation as Promise<T> | (() => T)),
                };
            }

            if (typeof operationOrMessageOrOptions === 'function' || operationOrMessageOrOptions instanceof Promise) {
                return { operationPromise: processOperation(operationOrMessageOrOptions) };
            }

            return {
                props: operationOrMessageOrOptions,
                operationPromise: processOperation(operation as Promise<T> | (() => T)),
            };
        };

        const { operationPromise, props } = processArgs();
        const modal = await this.openModal(this.requireComponent(UIComponents.LoadingModal), props);

        try {
            const [result] = await Promise.all([operationPromise, after({ seconds: 1 })]);

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
        if (!App.isMounted()) {
            await this.removeModal(id, result);

            return;
        }

        await Events.emit('close-modal', { id, result });
    }

    public async closeAllModals(): Promise<void> {
        while (this.modals.length > 0) {
            await this.closeModal(required(this.modals[this.modals.length - 1]).id);
        }
    }

    protected async boot(): Promise<void> {
        this.watchModalEvents();
        this.watchMountedEvent();
        this.watchViewportBreakpoints();
    }

    private async removeModal(id: string, result?: unknown): Promise<void> {
        this.setState(
            'modals',
            this.modals.filter((m) => m.id !== id),
        );

        this.modalCallbacks[id]?.closed?.(result);

        delete this.modalCallbacks[id];

        const activeModal = this.modals.at(-1);

        await (activeModal && Events.emit('show-modal', { id: activeModal.id }));
    }

    private watchModalEvents(): void {
        Events.on('modal-will-close', ({ modal, result }) => {
            this.modalCallbacks[modal.id]?.willClose?.(result);

            if (this.modals.length === 1) {
                Events.emit('hide-overlays-backdrop');
            }
        });

        Events.on('modal-closed', async ({ modal: { id }, result }) => {
            await this.removeModal(id, result);
        });
    }

    private watchMountedEvent(): void {
        Events.once('application-mounted', async () => {
            if (!globalThis.document || !globalThis.getComputedStyle) {
                return;
            }

            const splash = globalThis.document.getElementById('splash');

            if (!splash) {
                return;
            }

            if (globalThis.getComputedStyle(splash).opacity !== '0') {
                splash.style.opacity = '0';

                await after({ ms: 600 });
            }

            splash.remove();
        });
    }

    private watchViewportBreakpoints(): void {
        if (!globalThis.matchMedia) {
            return;
        }

        const media = globalThis.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);

        media.addEventListener('change', () => this.setState({ layout: getCurrentLayout() }));
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
