import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';

import I18nMessages from './I18nMessages';
import { createAppI18n } from './i18n';

describe('i18n', () => {

    it('Initializes messages', async () => {
        // Arrange
        const messages = new I18nMessages(import.meta.glob('@aerogel/plugin-i18n/testing/stubs/lang/*'));

        vi.mock('vue-i18n', () => ({ createI18n: vi.fn(() => ({})) }));

        // Act
        await createAppI18n({ messages });

        // Assert
        const mockedCreateI18n = vi.mocked(createI18n);

        expect(mockedCreateI18n).toHaveBeenCalled();
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages).key('en').to.exist;
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages?.['en']).key('foo').to.exist;
    });

});
