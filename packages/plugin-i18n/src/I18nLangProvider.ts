import { toString } from '@noeldemartin/utils';
import type { Composer } from 'vue-i18n';
import type { LangProvider } from '@aerogel/core';

import type I18nMessages from './I18nMessages';

export default class I18nLangProvider implements LangProvider {

    constructor(
        private i18n: Composer,
        private messages: I18nMessages,
    ) {
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

    public translate(key: string, parameters?: Record<string, unknown> | number): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return this.i18n.t(key, (parameters as any) ?? {});
    }

    public translateWithDefault(
        key: string,
        defaultMessage: string,
        parameters?: Record<string, unknown> | number,
    ): string {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const message = this.i18n.t(key, (parameters as any) ?? {}, { missingWarn: false });

        return message === key ? this.replaceParameters(defaultMessage, parameters) : message;
    }

    private replaceParameters(message: string, parameters: Record<string, unknown> | number = {}): string {
        if (typeof parameters === 'number') {
            const plurals = message.split('|').map((plural) => plural.trim());
            const pluralMessage = plurals[parameters] ?? plurals[2] ?? message;

            return this.replaceParameters(pluralMessage, { n: parameters });
        }

        return Object.entries(parameters).reduce((text, [name, value]) => {
            return text.replace(new RegExp(`\\{.*${name}[^}]*\\}`), toString(value));
        }, message);
    }

}
