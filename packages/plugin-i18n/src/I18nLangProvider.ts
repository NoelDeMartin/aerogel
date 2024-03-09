import type { Composer } from 'vue-i18n';
import type { LangProvider } from '@aerogel/core';

export default class I18nLangProvider implements LangProvider {

    private i18n: Composer;

    constructor(i18n: Composer) {
        this.i18n = i18n;
    }

    public translate(key: string, parameters?: Record<string, unknown>): string {
        return this.i18n.t(key, parameters ?? {});
    }

    public translateWithDefault(key: string, defaultMessage: string, parameters?: Record<string, unknown>): string {
        return this.i18n.t(key, parameters ?? {}, { default: defaultMessage, missingWarn: false });
    }

}
