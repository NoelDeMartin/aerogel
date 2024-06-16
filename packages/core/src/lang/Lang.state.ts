import { defineServiceState } from '@/services/Service';

export default defineServiceState({
    name: 'lang',
    persist: ['locale', 'fallbackLocale'],
    initialState: {
        locale: null as string | null,
        locales: ['en'],
        fallbackLocale: 'en',
    },
});
