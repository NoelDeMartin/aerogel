import { createI18n } from 'vue-i18n';
import type { I18n, Locale } from 'vue-i18n';

import type I18nMessages from './I18nMessages';
import type { Options } from './options';

export async function createAppI18n(
    options: Omit<Options, 'messages'> & { messages: I18nMessages },
): Promise<I18n<{}, {}, {}, Locale, false>> {
    const locale = options.defaultLocale ?? 'en';
    const fallbackLocale = options.fallbackLocale ?? 'en';

    await options.messages.loadLocale(locale);
    await options.messages.loadLocale(fallbackLocale);

    return createI18n({
        legacy: false,
        warnHtmlMessage: false,
        locale,
        fallbackLocale,
        messages: options.messages.getMessages(),
    });
}
