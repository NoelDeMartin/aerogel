import { fail, stringMatch } from '@noeldemartin/utils';
import type { LocaleMessages, VueMessageType } from 'vue-i18n';

type Messages = LocaleMessages<VueMessageType, string, string>;
type MessagesLoader = () => Promise<Messages>;

export type Listener = (locale: string, messages: Messages) => unknown;

export default class I18nMessages {

    private listeners: Listener[] = [];
    private messages: Record<string, Messages> = {};
    private loaders: Record<string, MessagesLoader>;

    constructor(loaders: Record<string, unknown>) {
        this.loaders = Object.entries(loaders).reduce(
            (messageLoaders, [fileName, loader]) => {
                const locale = stringMatch<2>(fileName, /.*\/lang\/(.+)\.yaml/)?.[1];

                if (locale) {
                    messageLoaders[locale] = () =>
                        (loader as () => Promise<{ default: Messages }>)().then(({ default: messages }) => messages);
                }

                return messageLoaders;
            },
            {} as Record<string, MessagesLoader>,
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

        const loader = this.loaders[locale] ?? fail<MessagesLoader>(`Couldn't load messages for '${locale}' locale`);
        const localeMessages = await loader();

        this.messages[locale] = localeMessages;
        this.listeners.forEach((listener) => listener(locale, localeMessages));

        return localeMessages;
    }

}
