import type { Composer } from 'vue-i18n';
import type { LangProvider } from '@aerogel/core';

import type I18nMessages from './I18nMessages';

export default class I18nLangProvider implements LangProvider {

    constructor(private i18n: Composer, private messages: I18nMessages) {
        this.messages.addListener((locale, localeMessages) => this.i18n.setLocaleMessage(locale, localeMessages));
    }

    public getLocale(): string {
        return this.i18n.locale.value;
    }

    public async setLocale(locale: string): Promise<void> {
        await this.messages.loadLocale(locale);

        this.i18n.locale.value = locale;
    }

    public getFallbackLocale(): string {
        const fallbackLocale = this.i18n.fallbackLocale.value;

        if (typeof fallbackLocale !== 'string') {
            return '';
        }

        return fallbackLocale;
    }

    public async setFallbackLocale(fallbackLocale: string): Promise<void> {
        await this.messages.loadLocale(fallbackLocale);

        this.i18n.fallbackLocale.value = fallbackLocale;
    }

    public getLocales(): string[] {
        return this.messages.getLocales();
    }

    public translate(key: string, parameters?: Record<string, unknown>): string {
        return this.i18n.t(key, parameters ?? {});
    }

    public translateWithDefault(key: string, defaultMessage: string, parameters?: Record<string, unknown>): string {
        return this.i18n.t(key, parameters ?? {}, { default: defaultMessage, missingWarn: false });
    }

}
