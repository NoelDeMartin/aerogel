import { after, facade, fail, isDevelopment, uuid } from '@noeldemartin/utils';
import { markRaw, unref } from 'vue';
import type { Constructor } from '@noeldemartin/utils';
import type { Component, ComputedOptions, MethodOptions } from 'vue';

import Events from '@aerogel/core/services/Events';
import { closeModal, createModal, modals, showModal } from '@aerogel/core/ui/modals';
import type { GetModalProps, GetModalResponse } from '@aerogel/core/ui/modals';
import type { AcceptRefs } from '@aerogel/core/utils';
import type { AlertModalExpose, AlertModalProps } from '@aerogel/core/components/contracts/AlertModal';
import type { ButtonVariant } from '@aerogel/core/components/contracts/Button';
import type { LoadingModalExpose, LoadingModalProps } from '@aerogel/core/components/contracts/LoadingModal';
import type { ToastAction, ToastExpose, ToastProps, ToastVariant } from '@aerogel/core/components/contracts/Toast';
import type {
    ConfirmModalCheckboxes,
    ConfirmModalEmits,
    ConfirmModalExpose,
    ConfirmModalProps,
} from '@aerogel/core/components/contracts/ConfirmModal';
import type {
    ErrorReportModalExpose,
    ErrorReportModalProps,
} from '@aerogel/core/components/contracts/ErrorReportModal';
import type {
    PromptModalEmits,
    PromptModalExpose,
    PromptModalProps,
} from '@aerogel/core/components/contracts/PromptModal';

import Service from './UI.state';
import { MOBILE_BREAKPOINT, getCurrentLayout } from './utils';
import type { UIToast } from './UI.state';

export type UIComponent<Props = {}, Exposed = {}, Emits = {}> = Constructor<{ $emit?: Emits } & Exposed> &
    Component<Props, {}, {}, ComputedOptions, MethodOptions, {}, {}>;

export interface UIComponents {
    'alert-modal': UIComponent<AlertModalProps, AlertModalExpose>;
    'confirm-modal': UIComponent<ConfirmModalProps, ConfirmModalExpose, ConfirmModalEmits>;
    'error-report-modal': UIComponent<ErrorReportModalProps, ErrorReportModalExpose>;
    'loading-modal': UIComponent<LoadingModalProps, LoadingModalExpose>;
    'prompt-modal': UIComponent<PromptModalProps, PromptModalExpose, PromptModalEmits>;
    'router-link': UIComponent;
    'startup-crash': UIComponent;
    toast: UIComponent<ToastProps, ToastExpose>;
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
        const { response } = await this.modal(this.requireComponent('confirm-modal'), properties);
        const confirmed = typeof response === 'object' ? response[0] : (response ?? false);
        const checkboxes =
            typeof response === 'object'
                ? response[1]
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

        const { response } = await this.modal(this.requireComponent('prompt-modal'), getProperties());
        const result = trim && typeof response === 'string' ? response?.trim() : response;

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

        const modal = createModal(this.requireComponent('loading-modal'), props);

        showModal(modal);

        try {
            const result = await operationPromise;

            await after({ ms: 500 });

            return result;
        } finally {
            await closeModal(modal.id, { removeAfter: 1000 });
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
        component: T & object extends GetModalProps<T> ? T : never,
        props?: GetModalProps<T>
    ): Promise<GetModalResponse<T>>;

    public modal<T extends Component>(
        component: T & object extends GetModalProps<T> ? never : T,
        props: GetModalProps<T>
    ): Promise<GetModalResponse<T>>;

    public modal<T extends Component>(component: T, componentProps?: GetModalProps<T>): Promise<GetModalResponse<T>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return showModal(component as any, componentProps ?? {}) as Promise<GetModalResponse<T>>;
    }

    public async closeAllModals(): Promise<void> {
        await Promise.all(modals.value.map(({ id }) => closeModal(id, { removeAfter: 1000 })));
    }

    protected override async boot(): Promise<void> {
        this.watchMountedEvent();
        this.watchViewportBreakpoints();
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
