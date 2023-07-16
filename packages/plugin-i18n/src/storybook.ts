import { createI18n } from 'vue-i18n';
import type { App } from 'vue';
import type { I18nOptions } from 'vue-i18n';

export function setupStorybook(app: App, messages: Record<string, unknown>): void {
    app.use(
        createI18n({
            locale: 'en',
            fallbackLocale: 'en',
            messages: { en: messages } as I18nOptions['messages'],
        }),
    );
}
