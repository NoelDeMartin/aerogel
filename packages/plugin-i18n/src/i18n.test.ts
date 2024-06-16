import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';

import I18nMessages from './I18nMessages';
import { createAppI18n } from './i18n';

describe('i18n', () => {

    it('Initializes messages', async () => {
        // Arrange
        vi.mock('vue-i18n', () => ({ createI18n: vi.fn(() => ({ i18nMock: true })) }));

        // Act
        await createAppI18n({ messages: new I18nMessages(import.meta.glob('@/testing/stubs/lang/*')) });

        // Assert
        const mockedCreateI18n = vi.mocked(createI18n);

        expect(mockedCreateI18n).toHaveBeenCalled();
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages).key('en').to.exist;
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages?.['en']).key('foo').to.exist;
    });

});
