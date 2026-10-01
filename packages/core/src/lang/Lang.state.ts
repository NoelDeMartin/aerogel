import { defineServiceState } from '@aerogel/core/services/utils';

import { SYSTEM_LOCALE } from './constants';
import { getBrowserLocale } from './utils';

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
            selectedLocale === SYSTEM_LOCALE ? (getBrowserLocale(locales) ?? fallbackLocale) : selectedLocale,
    },
});
