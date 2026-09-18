import { defineServiceState } from '@aerogel/core/services/utils';
import { getBrowserLocale } from './utils';
import { SYSTEM_LOCALE } from './constants';

export default defineServiceState({
    name: 'lang',
    persist: ['selectedLocale', 'fallbackLocale'],
    initialState: {
        selectedLocale: SYSTEM_LOCALE,
        locales: ['en'],
        fallbackLocale: 'en',
    },
    computed: {
        locale: ({ selectedLocale, locales, fallbackLocale }) =>
            selectedLocale === SYSTEM_LOCALE
                ? getBrowserLocale(locales) ?? fallbackLocale
                : selectedLocale,
    },
});
