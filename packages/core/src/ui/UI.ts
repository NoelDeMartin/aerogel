import { after, facade, fail, isDevelopment, required, uuid } from '@noeldemartin/utils';
import { markRaw, nextTick, unref } from 'vue';
import type { ComponentExposed, ComponentProps } from 'vue-component-type-helpers';
import type { Component } from 'vue';
import type { ClosureArgs } from '@noeldemartin/utils';

import App from '@aerogel/core/services/App';
import Events from '@aerogel/core/services/Events';
import type {
    ConfirmModalCheckboxes,
    ConfirmModalExpose,
    ConfirmModalProps,
} from '@aerogel/core/components/contracts/ConfirmModal';
import type {
    ErrorReportModalExpose,
    ErrorReportModalProps,
} from '@aerogel/core/components/contracts/ErrorReportModal';
import type { AcceptRefs } from '@aerogel/core/utils';
import type { AlertModalExpose, AlertModalProps } from '@aerogel/core/components/contracts/AlertModal';
import type { ButtonVariant } from '@aerogel/core/components/contracts/Button';
import type { LoadingModalExpose, LoadingModalProps } from '@aerogel/core/components/contracts/LoadingModal';
import type { PromptModalExpose, PromptModalProps } from '@aerogel/core/components/contracts/PromptModal';
import type { ToastAction, ToastExpose, ToastProps, ToastVariant } from '@aerogel/core/components/contracts/Toast';

import Service from './UI.state';
import { MOBILE_BREAKPOINT, getCurrentLayout } from './utils';
import type { UIModal, UIToast } from './UI.state';

interface ModalCallbacks<T = unknown> {
    willClose(result: T | undefined): void;
    hasClosed(result: T | undefined): void;
}

export type ModalResult<T> = ModalExposeResult<ComponentExposed<T>>;
export type ModalExposeResult<T> = T extends { close(result?: infer Result): Promise<void> } ? Result : unknown;
export type UIComponent<Props = {}, Exposed = {}> = { new (...args: ClosureArgs): Exposed & { $props: Props } };

export interface UIComponents {
    'alert-modal': UIComponent<AlertModalProps, AlertModalExpose>;
    'confirm-modal': UIComponent<ConfirmModalProps, ConfirmModalExpose>;
    'error-report-modal': UIComponent<ErrorReportModalProps, ErrorReportModalExpose>;
    'loading-modal': UIComponent<LoadingModalProps, LoadingModalExpose>;
    'prompt-modal': UIComponent<PromptModalProps, PromptModalExpose>;
    'router-link': UIComponent;
    'startup-crash': UIComponent;
    toast: UIComponent<ToastProps, ToastExpose>;
}

export interface UIModalContext {
    modal: UIModal;
    childIndex?: number;
}

export type ConfirmOptions = AcceptRefs<{
    acceptText?: string;
    acceptVariant?: ButtonVariant;
    cancelText?: string;
    cancelVariant?: ButtonVariant;
    actions?: Record<string, () => unknown>;
    required?: boolean;
}>;

export type LoadingOptions = AcceptRefs<{
    title?: string;
    message?: string;
    progress?: number;
    delay?: number;
}>;

export interface ConfirmOptionsWithCheckboxes<T extends ConfirmModalCheckboxes = ConfirmModalCheckboxes>
    extends ConfirmOptions {
    checkboxes?: T;
}

export type PromptOptions = AcceptRefs<{
    label?: string;
    defaultValue?: string;
    placeholder?: string;
    acceptText?: string;
    acceptVariant?: ButtonVariant;
    cancelText?: string;
    cancelVariant?: ButtonVariant;
    trim?: boolean;
}>;

export interface ToastOptions {
    component?: Component;
    variant?: ToastVariant;
    actions?: ToastAction[];
}

export class UIService extends Service {

    private modalCallbacks: Record<string, Partial<ModalCallbacks>> = {};
    private components: Partial<UIComponents> = {};

    public registerComponent<T extends keyof UIComponents>(name: T, component: UIComponents[T]): void {
        this.components[name] = component;
    }

    public resolveComponent<T extends keyof UIComponents>(name: T): UIComponents[T] | null {
        return this.components[name] ?? null;
    }

    public requireComponent<T extends keyof UIComponents>(name: T): UIComponents[T] {
        return this.resolveComponent(name) ?? fail(`UI Component '${name}' is not defined!`);
    }

    public alert(message: string): void;
    public alert(title: string, message: string): void;
    public alert(messageOrTitle: string, message?: string): void {
        const getProperties = (): AlertModalProps => {
            if (typeof message !== 'string') {
                return { message: messageOrTitle };
            }

            return {
                title: messageOrTitle,
                message,
            };
        };

        this.modal(this.requireComponent('alert-modal'), getProperties());
    }

    /* eslint-disable max-len */
    public async confirm(message: string, options?: ConfirmOptions): Promise<boolean>;
    public async confirm(title: string, message: string, options?: ConfirmOptions): Promise<boolean>;
    public async confirm<T extends ConfirmModalCheckboxes>(message: string, options?: ConfirmOptionsWithCheckboxes<T>): Promise<[boolean, Record<keyof T, boolean>]>; // prettier-ignore
    public async confirm<T extends ConfirmModalCheckboxes>(title: string, message: string, options?: ConfirmOptionsWithCheckboxes<T>): Promise<[boolean, Record<keyof T, boolean>]>; // prettier-ignore
    /* eslint-enable max-len */

    public async confirm(
        messageOrTitle: string,
        messageOrOptions?: string | ConfirmOptions | ConfirmOptionsWithCheckboxes,
        options?: ConfirmOptions | ConfirmOptionsWithCheckboxes,
    ): Promise<boolean | [boolean, Record<string, boolean>]> {
        const getProperties = (): AcceptRefs<ConfirmModalProps> => {
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
        const result = await this.modalForm(this.requireComponent('confirm-modal'), properties);
        const confirmed = typeof result === 'object' ? result[0] : (result ?? false);
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

            if (confirmed && isDevelopment()) {
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
        const getProperties = (): PromptModalProps => {
            if (typeof messageOrOptions !== 'string') {
                return {
                    message: messageOrTitle,
                    ...(messageOrOptions ?? {}),
                } as PromptModalProps;
            }

            return {
                title: messageOrTitle,
                message: messageOrOptions,
                ...(options ?? {}),
            } as PromptModalProps;
        };

        const rawResult = await this.modalForm(this.requireComponent('prompt-modal'), getProperties());
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
        const processArgs = (): {
            operationPromise: Promise<T>;
            props?: AcceptRefs<LoadingModalProps>;
            delay?: number;
        } => {
            if (typeof operationOrMessageOrOptions === 'string') {
                return {
                    props: { message: operationOrMessageOrOptions },
                    operationPromise: processOperation(operation as Promise<T> | (() => T)),
                };
            }

            if (typeof operationOrMessageOrOptions === 'function' || operationOrMessageOrOptions instanceof Promise) {
                return { operationPromise: processOperation(operationOrMessageOrOptions) };
            }

            const { delay, ...props } = operationOrMessageOrOptions;

            return {
                props,
                delay: unref(delay),
                operationPromise: processOperation(operation as Promise<T> | (() => T)),
            };
        };

        let delayed = false;
        const { operationPromise, props, delay } = processArgs();

        delay && (await Promise.race([after({ ms: delay }).then(() => (delayed = true)), operationPromise]));

        if (delay && !delayed) {
            return operationPromise;
        }

        const modal = await this.modal(this.requireComponent('loading-modal'), props);

        try {
            const result = await operationPromise;

            await after({ ms: 500 });

            return result;
        } finally {
            await this.closeModal(modal.id);
        }
    }

    public toast(message: string, options: ToastOptions = {}): void {
        const { component, ...otherOptions } = options;
        const toast: UIToast = {
            id: uuid(),
            properties: { message, ...otherOptions },
            component: markRaw(component ?? this.requireComponent('toast')),
        };

        this.setState('toasts', this.toasts.concat(toast));
    }

    public modal<T extends Component>(
        ...args: {} extends ComponentProps<T>
            ? [component: T, props?: AcceptRefs<ComponentProps<T>>]
            : [component: T, props: AcceptRefs<ComponentProps<T>>]
    ): Promise<UIModal<ModalResult<T>>>;

    public async modal<T extends Component>(component: T, props?: ComponentProps<T>): Promise<UIModal<ModalResult<T>>> {
        const id = uuid();
        const callbacks: Partial<ModalCallbacks<ModalResult<T>>> = {};
        const modal: UIModal<ModalResult<T>> = {
            id,
            closing: false,
            properties: props ?? {},
            component: markRaw(component),
            beforeClose: new Promise((resolve) => (callbacks.willClose = resolve)),
            afterClose: new Promise((resolve) => (callbacks.hasClosed = resolve)),
        };
        const modals = this.modals.concat(modal);

        this.modalCallbacks[modal.id] = callbacks;

        this.setState({ modals });

        await nextTick();

        return modal;
    }

    public modalForm<T extends Component>(
        ...args: {} extends ComponentProps<T>
            ? [component: T, props?: AcceptRefs<ComponentProps<T>>]
            : [component: T, props: AcceptRefs<ComponentProps<T>>]
    ): Promise<ModalResult<T> | undefined>;

    public async modalForm<T extends Component>(
        component: T,
        props?: ComponentProps<T>,
    ): Promise<ModalResult<T> | undefined> {
        const modal = await this.modal<T>(component, props as ComponentProps<T>);
        const result = await modal.beforeClose;

        return result;
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

    protected override async boot(): Promise<void> {
        this.watchModalEvents();
        this.watchMountedEvent();
        this.watchViewportBreakpoints();
    }

    private async removeModal(id: string, result?: unknown): Promise<void> {
        this.setState(
            'modals',
            this.modals.filter((m) => m.id !== id),
        );

        this.modalCallbacks[id]?.hasClosed?.(result);

        delete this.modalCallbacks[id];
    }

    private watchModalEvents(): void {
        Events.on('modal-will-close', ({ modal: { id }, result }) => {
            const modal = this.modals.find((_modal) => id === _modal.id);

            if (modal) {
                modal.closing = true;
            }

            this.modalCallbacks[id]?.willClose?.(result);
        });

        Events.on('modal-has-closed', async ({ modal: { id }, result }) => {
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

declare module '@aerogel/core/services/Events' {
    export interface EventsPayload {
        'close-modal': { id: string; result?: unknown };
        'modal-will-close': { modal: UIModal; result?: unknown };
        'modal-has-closed': { modal: UIModal; result?: unknown };
    }
}
