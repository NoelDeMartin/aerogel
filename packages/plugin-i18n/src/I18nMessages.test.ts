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

    it('keeps compiled messages intact', async () => {
        // Arrange
        const compiledTitle = { type: 0, body: { type: 2, items: [{ type: 3, value: 'Movies' }] } };
        const messages = new I18nMessages({
            '/src/lang/en.yaml': async () => ({ default: { movies: { title: compiledTitle } } }),
            '/src/modules/movies/lang/en.yaml': async () => ({ default: { movies: { empty: 'No movies' } } }),
        });

        // Act
        const enMessages = await messages.loadLocale('en');

        // Assert
        expect(enMessages).toEqual({ movies: { title: compiledTitle, empty: 'No movies' } });
    });

    it('keeps minified compiled messages intact', async () => {
        // Arrange
        const compiledTitle = { t: 0, b: { t: 2, i: [{ t: 3, v: 'Movies' }] } };
        const messages = new I18nMessages({
            '/src/lang/en.yaml': async () => ({ default: { movies: { title: compiledTitle } } }),
            '/src/modules/movies/lang/en.yaml': async () => ({ default: { movies: { empty: 'No movies' } } }),
        });

        // Act
        const enMessages = await messages.loadLocale('en');

        // Assert
        expect(enMessages).toEqual({ movies: { title: compiledTitle, empty: 'No movies' } });
    });

    it('replaces compiled messages defined in multiple files', async () => {
        // Arrange
        const moduleTitle = { t: 0, b: { t: 2, i: [{ t: 3, v: 'Movies' }], s: 'Movies' } };
        const appTitle = { t: 0, b: { t: 2, i: [{ t: 3, v: 'My Movies' }] } };
        const messages = new I18nMessages({
            '/src/lang/en.yaml': async () => ({ default: { movies: { title: appTitle } } }),
            '/src/modules/movies/lang/en.yaml': async () => ({ default: { movies: { title: moduleTitle } } }),
        });

        // Act
        const enMessages = await messages.loadLocale('en');

        // Assert
        expect(enMessages).toEqual({ movies: { title: appTitle } });
    });

    it('merges groups with keys used by compiled messages', async () => {
        // Arrange
        const messages = new I18nMessages({
            '/src/lang/en.yaml': async () => ({ default: { form: { type: 'Kind', body: 'Content' } } }),
            '/src/modules/notes/lang/en.yaml': async () => ({
                default: { form: { type: 'Type', body: 'Body', title: 'Title' } },
            }),
        });

        // Act
        const enMessages = await messages.loadLocale('en');

        // Assert
        expect(enMessages).toEqual({ form: { type: 'Kind', body: 'Content', title: 'Title' } });
    });
});
