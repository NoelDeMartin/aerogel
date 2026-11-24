import { aerogelDirectives } from '@aerogel/core/directives';
import { translateWithDefault } from '@aerogel/core/lang';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { type Component, nextTick } from 'vue';

import Combobox from './Combobox.vue';

describe('Combobox', () => {
    const LANGUAGES: Record<string, string> = {
        en: 'English',
        es: 'Spanish',
        ja: 'Japanese',
    };

    beforeEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
        vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(200);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(200);
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
            width: 200,
            height: 32,
            top: 0,
            left: 0,
            bottom: 32,
            right: 200,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
    });

    it('shows all options on focus even when a value is selected', async () => {
        // Arrange
        const { input } = mountCombobox();

        // Act
        await input.trigger('focus');
        await nextTick();
        await nextTick();

        // Assert
        expect(input.element.value).toBe('English');
        expect(getOptionLabels()).toEqual(['English', 'Spanish', 'Japanese']);
    });

    it('does not call renderOption with empty string when clearing the input', async () => {
        // Arrange
        const renderOption = vi.fn(renderLanguage);
        const { wrapper, input } = mountCombobox({ renderOption });

        renderOption.mockClear();

        // Act
        await input.trigger('focus');
        await input.setValue('');
        await nextTick();

        // Assert
        expect(renderOption).not.toHaveBeenCalledWith('');
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null]);
        expect(input.element.value).toBe('');
    });

    it('does not overwrite input while typing characters that match a renderOption code', async () => {
        // Arrange
        const { input } = mountCombobox();

        // Act
        await input.trigger('focus');
        await input.setValue('ja');
        await nextTick();
        await nextTick();

        // Assert
        expect(input.element.value).toBe('ja');
        expect(getOptionLabels()).toEqual(['ja', 'Japanese']);
    });

    it('filters options once the user starts typing and allows selecting an option', async () => {
        // Arrange
        const { wrapper, input } = mountCombobox();

        // Act - Filter
        await input.trigger('focus');
        await input.setValue('Span');
        await nextTick();
        await nextTick();

        // Assert - Filter
        expect(getOptionLabels()).toEqual(['Span', 'Spanish']);

        // Act - Select
        const spanishOption = getOptionElements().find((el) => el.textContent?.trim() === 'Spanish');

        spanishOption?.click();
        await nextTick();

        // Assert - Select
        expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['es']);
        expect(input.element.value).toBe('Spanish');
    });

    it('updates input when modelValue changes externally', async () => {
        // Arrange
        const { wrapper, input } = mountCombobox({ modelValue: 'es' });

        // Act
        await wrapper.setProps({ modelValue: 'en' });
        await nextTick();

        // Assert
        expect(input.element.value).toBe('English');
    });

    function mountCombobox(props: Record<string, unknown> = {}) {
        const wrapper = mount(Combobox as unknown as Component, {
            attachTo: document.body,
            global: {
                directives: aerogelDirectives,
                mocks: { $td: translateWithDefault },
            },
            props: {
                options: ['en', 'es', 'ja'],
                renderOption: renderLanguage,
                modelValue: 'en',
                ...props,
            },
        });

        return {
            wrapper,
            input: wrapper.find<HTMLInputElement>('input'),
        };
    }

    function renderLanguage(code: string): string {
        if (!code) {
            throw new RangeError('invalid value "" for option language');
        }

        return LANGUAGES[code] ?? code;
    }

    function getOptionElements(): HTMLElement[] {
        return Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'));
    }

    function getOptionLabels(): string[] {
        return getOptionElements().map((el) => el.textContent?.trim() ?? '');
    }
});
