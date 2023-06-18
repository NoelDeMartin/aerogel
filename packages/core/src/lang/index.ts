import { createI18n } from 'vue-i18n';
import { fail, stringMatch } from '@noeldemartin/utils';
import type { I18nOptions } from 'vue-i18n';
import type { Plugin } from 'vue';

import { defineBootstrapHook, onAppMounted } from '@/bootstrap/hooks';
import { bootServices } from '@/services';
import type { BootstrapOptions } from '@/bootstrap/options';

import Lang from './Lang';

const services = { $lang: Lang };

function getLangOptions(options: BootstrapOptions): LangOptions | null {
    if (options.lang) {
        return options.lang;
    }

    if (options.langMessages) {
        return { messages: options.langMessages };
    }

    return null;
}

function getMessageLoaders(messageLoaders: Record<string, unknown>): Record<string, LazyMessages> {
    return Object.entries(messageLoaders).reduce((loaders, [fileName, loader]) => {
        const locale = stringMatch<2>(fileName, /.*\/lang\/(.+)\.yaml/)?.[1];

        if (locale) {
            loaders[locale] = () =>
                (loader as () => Promise<{ default: Record<string, unknown> }>)().then(
                    ({ default: messages }) => messages,
                );
        }

        return loaders;
    }, {} as Record<string, LazyMessages>);
}

async function createAppI18n(options: LangOptions): Promise<Plugin> {
    const locale = options.defaultLocale ?? 'en';
    const fallbackLocale = options.fallbackLocale ?? 'en';
    const messageLoaders = getMessageLoaders(options.messages);
    const lazyMessages = messageLoaders[locale] ?? fail<LazyMessages>(`Missing messages for '${locale}' locale`);
    const messages = { [locale]: await lazyMessages() } as I18nOptions['messages'];

    return createI18n({ locale, fallbackLocale, messages });
}

export type LangServices = typeof services;

export type LazyMessages = () => Promise<Record<string, unknown>>;

export interface LangOptions {
    messages: Record<string, unknown>;
    defaultLocale?: string;
    fallbackLocale?: string;
}

export * from './helpers';
export { Lang };

export default defineBootstrapHook(async (app, options) => {
    const langOptions = getLangOptions(options);

    if (!langOptions) {
        return;
    }

    onAppMounted(() => Lang.setup());

    const plugin = await createAppI18n(langOptions);

    app.use(plugin);

    await bootServices(app, services);
});

declare module '@/bootstrap/options' {
    interface BootstrapOptions {
        lang?: LangOptions;
        langMessages?: Record<string, unknown>;
    }
}

declare module '@/services' {
    interface Services extends LangServices {}
}
