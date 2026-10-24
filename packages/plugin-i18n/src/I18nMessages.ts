import { arraySorted, isDevelopment, isPlainObject, stringMatch } from '@noeldemartin/utils';
import type { LocaleMessages, VueMessageType } from 'vue-i18n';

type Messages = LocaleMessages<VueMessageType, string, string>;
type MessagesLoader = () => Promise<Messages>;
type MessagesGroup = Record<string, unknown>;

function isCompiledMessage(value: object): boolean {
    const isResource = 'type' in value && value.type === 0 && 'body' in value;
    const isMinifiedResource = 't' in value && value.t === 0 && 'b' in value;

    return isResource || isMinifiedResource;
}

function isMessagesGroup(value: unknown): value is MessagesGroup {
    return isPlainObject(value) && !isCompiledMessage(value);
}

function mergeMessages(target: MessagesGroup, source: MessagesGroup): MessagesGroup {
    for (const [key, value] of Object.entries(source)) {
        if (!isMessagesGroup(value)) {
            target[key] = value;

            continue;
        }

        const targetValue = target[key];

        target[key] = mergeMessages(isMessagesGroup(targetValue) ? targetValue : {}, value);
    }

    return target;
}

export type Listener = (locale: string, messages: Messages) => unknown;

export default class I18nMessages {
    private listeners: Listener[] = [];
    private messages: Record<string, Messages> = {};
    private loaders: Record<string, MessagesLoader[]>;

    constructor(loaders: Record<string, unknown>) {
        const fileNames = arraySorted(Object.keys(loaders), (a, b) => {
            const aIsModule = a.includes('/modules/');
            const bIsModule = b.includes('/modules/');

            return aIsModule === bIsModule ? a.localeCompare(b) : aIsModule ? -1 : 1;
        });

        this.loaders = fileNames.reduce(
            (messageLoaders, fileName) => {
                const locale = stringMatch<2>(fileName, /.*\/lang\/(.+)\.yaml/)?.[1];
                const loader = loaders[fileName] as () => Promise<{ default: Messages }>;

                if (locale) {
                    (messageLoaders[locale] ??= []).push(() => loader().then(({ default: messages }) => messages));
                }

                return messageLoaders;
            },
            {} as Record<string, MessagesLoader[]>,
        );
    }

    public getMessages(): Record<string, Messages> {
        return Object.assign({}, this.messages);
    }

    public getLocales(): string[] {
        return Object.keys(this.loaders);
    }

    public addListener(listener: Listener): void {
        this.listeners.push(listener);
    }

    public async loadLocale(locale: string): Promise<Messages> {
        if (locale in this.messages) {
            return this.messages[locale] as Messages;
        }

        const loaders = this.loaders[locale];

        if (!loaders) {
            this.messages[locale] = {};
            this.listeners.forEach((listener) => listener(locale, {}));

            if (isDevelopment()) {
                // oxlint-disable-next-line no-console
                console.warn(`Locale ${locale} not found`);
            }

            return {};
        }

        const localeMessages = (await Promise.all(loaders.map((loader) => loader()))).reduce<Messages>(
            (messages, fileMessages) => mergeMessages(messages, fileMessages) as Messages,
            {},
        );

        this.messages[locale] = localeMessages;
        this.listeners.forEach((listener) => listener(locale, localeMessages));

        return localeMessages;
    }
}
