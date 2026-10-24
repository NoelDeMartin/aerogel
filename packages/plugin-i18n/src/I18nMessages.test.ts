import { describe, expect, it } from 'vite-plus/test';

import I18nMessages from './I18nMessages';

describe('I18nMessages', () => {
    it('merges messages from multiple files', async () => {
        // Arrange
        const messages = new I18nMessages({
            '/src/lang/en.yaml': async () => ({
                default: { app: { title: 'Media Kraken' }, movies: { title: 'My Movies' } },
            }),
            '/src/modules/movies/lang/en.yaml': async () => ({
                default: { movies: { title: 'Movies', empty: 'No movies' } },
            }),
            '/src/modules/shows/lang/en.yaml': async () => ({
                default: { shows: { title: 'Shows' } },
            }),
            '/src/lang/es.yaml': async () => ({
                default: { app: { title: 'Media Kraken (es)' } },
            }),
        });

        // Act
        const enMessages = await messages.loadLocale('en');

        // Assert
        expect(messages.getLocales()).toEqual(['en', 'es']);
        expect(enMessages).toEqual({
            app: { title: 'Media Kraken' },
            movies: { title: 'My Movies', empty: 'No movies' },
            shows: { title: 'Shows' },
        });
    });
});
