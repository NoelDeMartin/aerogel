import App from '@/services/App';

import type { LangProvider } from './Lang';

export default class DefaultLangProvider implements LangProvider {

    constructor(private locale: string, private fallbackLocale: string) {}

    public getLocale(): string {
        return this.locale;
    }

    public async setLocale(locale: string): Promise<void> {
        this.locale = locale;
    }

    public getFallbackLocale(): string {
        return this.fallbackLocale;
    }

    public async setFallbackLocale(fallbackLocale: string): Promise<void> {
        this.fallbackLocale = fallbackLocale;
    }

    public getLocales(): string[] {
        return ['en'];
    }

    public translate(key: string): string {
        // eslint-disable-next-line no-console
        App.development && console.warn('Lang provider is missing');

        return key;
    }

    public translateWithDefault(_: string, defaultMessage: string): string {
        // eslint-disable-next-line no-console
        App.development && console.warn('Lang provider is missing');

        return defaultMessage;
    }

}
