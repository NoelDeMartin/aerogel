import { createI18n } from 'vue-i18n';
import type { I18n, Locale } from 'vue-i18n';

import type I18nMessages from './I18nMessages';
import type { Options } from './options';

type AppI18nOptions = Options & { messages: I18nMessages };

function appLocales(options: AppI18nOptions): { locale: string; fallbackLocale: string } {
    return {
        locale: options.defaultLocale ?? 'en',
        fallbackLocale: options.fallbackLocale ?? 'en',
    };
}

export function createAppI18n(options: AppI18nOptions): I18n<{}, {}, {}, Locale, false> {
    const { locale, fallbackLocale } = appLocales(options);

    return createI18n({
        legacy: false,
        warnHtmlMessage: false,
        locale,
        fallbackLocale,
        messages: options.messages.getMessages(),
    });
}

export async function loadAppLocales(options: AppI18nOptions): Promise<void> {
    const { locale, fallbackLocale } = appLocales(options);

    await options.messages.loadLocale(locale);
    await options.messages.loadLocale(fallbackLocale);
}
