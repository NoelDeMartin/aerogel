import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';

import I18nMessages from './I18nMessages';
import { createAppI18n, loadAppLocales } from './i18n';

vi.mock('vue-i18n', () => ({ createI18n: vi.fn(() => ({})) }));

describe('i18n', () => {

    it('Creates i18n before loading messages', () => {
        // Arrange
        const messages = new I18nMessages(import.meta.glob('@aerogel/plugin-i18n/testing/stubs/lang/*'));

        // Act
        createAppI18n({ messages });

        // Assert
        const mockedCreateI18n = vi.mocked(createI18n);

        expect(mockedCreateI18n).toHaveBeenCalled();
        expect(mockedCreateI18n.mock.calls[0]?.[0].locale).toBe('en');
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages).to.be.empty;
    });

    it('Loads locale messages', async () => {
        // Arrange
        const messages = new I18nMessages(import.meta.glob('@aerogel/plugin-i18n/testing/stubs/lang/*'));
        const listener = vi.fn();

        messages.addListener(listener);

        // Act
        await loadAppLocales({ messages });

        // Assert
        expect(messages.getMessages()).key('en').to.exist;
        expect(messages.getMessages()['en']).key('foo').to.exist;
        expect(listener).toHaveBeenCalledWith('en', expect.objectContaining({ foo: expect.anything() }));
    });

});
