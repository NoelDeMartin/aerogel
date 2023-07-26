import { createI18n } from 'vue-i18n';
import { fail, stringMatch } from '@noeldemartin/utils';
import type { I18n, I18nOptions, Locale } from 'vue-i18n';

import type { Options } from './options';

type LazyMessages = () => Promise<Record<string, unknown>>;

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

export async function createAppI18n(options: Options): Promise<I18n<{}, {}, {}, Locale, false>> {
    const locale = options.defaultLocale ?? 'en';
    const fallbackLocale = options.fallbackLocale ?? 'en';
    const messageLoaders = getMessageLoaders(options.messages);
    const lazyMessages = messageLoaders[locale] ?? fail<LazyMessages>(`Missing messages for '${locale}' locale`);
    const messages = { [locale]: await lazyMessages() } as I18nOptions['messages'];

    return createI18n({ legacy: false, locale, fallbackLocale, messages });
}
