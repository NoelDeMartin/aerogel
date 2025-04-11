import { describe, expect, it, vi } from 'vitest';
import { mock } from '@noeldemartin/testing';
import type { Composer } from 'vue-i18n';

import type I18nMessages from '@aerogel/plugin-i18n/I18nMessages';

import I18nLangProvider from './I18nLangProvider';

describe('I18nLangProvider', () => {

    it('uses defaults', () => {
        // Arrange
        const provider = new I18nLangProvider(
            mock<Composer>({ t: vi.fn((key) => key) }),
            mock<I18nMessages>({ addListener: vi.fn() }),
        );

        // Act
        const result = provider.translateWithDefault('greet', 'Greetings');

        // Assert
        expect(result).toBe('Greetings');
    });

    it('uses replacements in defaults', () => {
        // Arrange
        const provider = new I18nLangProvider(
            mock<Composer>({ t: vi.fn((key) => key) }),
            mock<I18nMessages>({ addListener: vi.fn() }),
        );

        // Act
        const result = provider.translateWithDefault('greet', 'Hello, {name}!', { name: 'Alice' });

        // Assert
        expect(result).toBe('Hello, Alice!');
    });

    it('uses plurals in defaults', () => {
        // Arrange
        const defaultMessage = 'I don\'t have any apples | I have one apples | I have {n} apples';
        const provider = new I18nLangProvider(
            mock<Composer>({ t: vi.fn((key) => key) }),
            mock<I18nMessages>({ addListener: vi.fn() }),
        );

        // Act & Assert
        expect(provider.translateWithDefault('apples', defaultMessage, 0)).toBe('I don\'t have any apples');
        expect(provider.translateWithDefault('apples', defaultMessage, 1)).toBe('I have one apples');
        expect(provider.translateWithDefault('apples', defaultMessage, 2)).toBe('I have 2 apples');
    });

});
