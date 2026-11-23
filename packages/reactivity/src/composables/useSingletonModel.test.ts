import { useSingletonModel } from '@aerogel/reactivity/composables/useSingletonModel';
import { resetModelsState } from '@aerogel/reactivity/lib/tracking';
import Book from '@aerogel/reactivity/testing/stubs/models/Book';
import Chapter from '@aerogel/reactivity/testing/stubs/models/Chapter';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { toRaw, watchEffect } from 'vue';

describe('useSingletonModel', () => {
    beforeEach(() => resetModelsState());

    it('Reacts to relation changes in singleton models', async () => {
        // Arrange
        const chaptersCount: number[] = [];
        const book = await Book.create({ title: 'Lorem ipsum' });

        await Chapter.create({ name: 'Chapter 1', bookUrl: book.url });

        const { model, loading } = useSingletonModel(Book);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        watchEffect(() => chaptersCount.push(model.value?.getRelation('chapters').getLoadedModels().length ?? 0));

        // Act
        await toRaw(model.value)?.loadRelation('chapters');

        // Assert
        await vi.waitFor(() => expect(chaptersCount).toEqual([0, 1]));
    });
});
