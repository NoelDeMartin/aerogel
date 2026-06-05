import { defineServiceState } from '@aerogel/core/services/utils';

export default defineServiceState({
    name: 'lang',
    persist: ['locale', 'fallbackLocale'],
    initialState: {
        locale: null as string | null,
        locales: ['en'],
        fallbackLocale: 'en',
    },
});
