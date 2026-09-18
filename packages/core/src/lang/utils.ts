import Lang from './Lang';

export const translate = Lang.translate.bind(Lang);
export const translateWithDefault = Lang.translateWithDefault.bind(Lang);

export function getBrowserLocale(locales: string[]): string | null {
    const browserLanguages =
        globalThis.navigator?.languages ?? (globalThis.navigator?.language ? [globalThis.navigator.language] : []);

    for (const language of browserLanguages) {
        if (locales.includes(language)) {
            return language;
        }

        const [baseLanguage] = language.split('-');

        if (!baseLanguage || !locales.includes(baseLanguage)) {
            continue;
        }

        return baseLanguage;
    }

    return null;
}
