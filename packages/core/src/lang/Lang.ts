import { facade } from '@noeldemartin/utils';

import DefaultLangProvider from './DefaultLangProvider';
import Service from './Lang.state';

export interface LangProvider {
    getLocale(): string;
    setLocale(locale: string): Promise<void>;
    getFallbackLocale(): string;
    setFallbackLocale(fallbackLocale: string): Promise<void>;
    getLocales(): string[];
    translate(key: string, parameters?: Record<string, unknown> | number): string;
    translateWithDefault(key: string, defaultMessage: string, parameters?: Record<string, unknown> | number): string;
}

export class LangService extends Service {

    private provider: LangProvider;

    constructor() {
        super();

        this.provider = new DefaultLangProvider(
            this.locale,
            this.fallbackLocale,
        );
    }

    public async setProvider(provider: LangProvider): Promise<void> {
        this.provider = provider;
        this.locales = provider.getLocales();

        await provider.setLocale(this.locale);
        await provider.setFallbackLocale(this.fallbackLocale);
    }

    public translate(key: string, parameters?: Record<string, unknown> | number): string {
        return this.provider.translate(key, parameters) ?? key;
    }

    public translateWithDefault(
        key: string,
        defaultMessage: string,
        parameters: Record<string, unknown> | number = {},
    ): string {
        return this.provider.translateWithDefault(key, defaultMessage, parameters);
    }

    protected override async boot(): Promise<void> {
        if (!globalThis.document) {
            return;
        }

        this.requireStore().$subscribe(
            async () => {
                await this.provider.setLocale(this.locale);
                await this.provider.setFallbackLocale(this.fallbackLocale);

                document.querySelector('html')?.setAttribute('lang', this.locale);
            },
            { immediate: true },
        );
    }

}

export default facade(LangService);
