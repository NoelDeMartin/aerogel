import { useModels } from '@aerogel/reactivity/composables/useModels';
import { getTrackedModelsData } from '@aerogel/reactivity/internals/tracking';
import { getTrackedModels, refreshTrackedModels, resetReactiveState } from '@aerogel/reactivity/lib/tracking';
import Item from '@aerogel/reactivity/testing/stubs/models/Item';
import Shelf from '@aerogel/reactivity/testing/stubs/models/Shelf';
import Task from '@aerogel/reactivity/testing/stubs/models/Task';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import { after } from '@noeldemartin/utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { nextTick, ref, toRaw, watchEffect } from 'vue';

describe('useModels', () => {
    beforeEach(() => resetReactiveState());

    it('Loads model collections on demand', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });

        // Act
        const { models: users, loading, refreshing } = useModels(User);

        // Assert
        expect(loading.value).toBe(true);
        expect(refreshing.value).toBe(true);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        expect(refreshing.value).toBe(false);

        expect(users.value.map((user) => user.name)).toEqual(['Alice']);

        await User.create({ name: 'Bob', age: 30 });

        expect(users.value).toHaveLength(2);
    });

    it('Includes soft-deleted models on demand', async () => {
        // Arrange
        const task = await Task.create({ name: 'Soft-deleted' });

        await Task.create({ name: 'Active' });
        await task.softDelete();

        // Act
        const { models: activeTasks, loading } = useModels(Task);
        const { models: allTasks } = useModels(Task, { includeSoftDeleted: true });

        // Assert
        await vi.waitFor(() => expect(loading.value).toBe(false));

        expect(activeTasks.value.map(({ name }) => name)).toEqual(['Active']);
        expect(allTasks.value.map(({ name }) => name)).toEqual(['Soft-deleted', 'Active']);
    });

    it('Reacts to relation changes in model collections', async () => {
        // Arrange
        const itemsCount: number[] = [];
        const shelf = await Shelf.create({ name: 'Shelf' });

        await Item.create({ name: 'Item', shelfUrl: shelf.url });

        const { models: shelves, loading } = useModels(Shelf);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        watchEffect(() => itemsCount.push(shelves.value[0]?.getRelation('items').getLoadedModels().length ?? 0));

        // Act
        await toRaw(shelves.value[0])?.loadRelation('items');

        // Assert
        await vi.waitFor(() => expect(itemsCount.at(-1)).toBe(1));
    });

    it('Refreshes model collections without loading', async () => {
        // Arrange
        await User.create({ name: 'Alice', age: 23 });

        const { loading, refreshing } = useModels(User);

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Act
        const refresh = refreshTrackedModels(User);

        // Assert
        expect(loading.value).toBe(false);
        expect(refreshing.value).toBe(true);

        await refresh;

        expect(loading.value).toBe(false);
        expect(refreshing.value).toBe(false);
    });

    it('Loads specified urls without loading the full collection', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const findSpy = vi.spyOn(User, 'find');
        const allSpy = vi.spyOn(User, 'all');

        // Act - Initial call
        const { models: users, loading } = useModels(User, { only: [alice.requireUrl()] });

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(modelUrls(users)).toEqual([alice.url]);
        expect(getTrackedModelsData(User).loaded.value).toBe(false);
        expect(getTrackedModels(User).map((user) => user.url)).toEqual([alice.url]);
        expect(findSpy).toHaveBeenCalledTimes(1);
        expect(findSpy).toHaveBeenCalledWith(alice.url, { includeSoftDeleted: true });
        expect(allSpy).not.toHaveBeenCalled();

        // Act - Call with a new url
        const { models: bothUsers, loading: loadingBoth } = useModels(User, {
            only: [alice.requireUrl(), bob.requireUrl()],
        });

        await vi.waitFor(() => expect(loadingBoth.value).toBe(false));

        // Assert
        expect(modelUrls(bothUsers)).toEqual([alice.url, bob.url]);
        expect(findSpy).toHaveBeenCalledTimes(2);
        expect(findSpy).toHaveBeenLastCalledWith(bob.url, { includeSoftDeleted: true });
    });

    it('Keeps separate loading states for filtered useModels calls', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const { resolve } = deferUserFind([bob.requireUrl()]);

        // Act
        const { models: aliceModels, loading: loadingAlice } = useModels(User, { only: [alice.requireUrl()] });
        const { models: bobModels, loading: loadingBob } = useModels(User, { only: [bob.requireUrl()] });

        await vi.waitFor(() => expect(loadingAlice.value).toBe(false));

        // Assert
        expect(modelUrls(aliceModels)).toEqual([alice.url]);
        expect(loadingBob.value).toBe(true);
        expect(bobModels.value).toHaveLength(0);

        resolve(bob.requireUrl());

        await vi.waitFor(() => expect(loadingBob.value).toBe(false));
        expect(modelUrls(bobModels)).toEqual([bob.url]);
    });

    it('Reacts to changes in a urls ref', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const findSpy = vi.spyOn(User, 'find');
        const allSpy = vi.spyOn(User, 'all');
        const urls = ref<string[]>([]);

        // Act - Initial empty ref
        const { models: users, loading } = useModels(User, { only: urls });

        // Assert
        expect(loading.value).toBe(false);
        expect(users.value).toEqual([]);
        expect(findSpy).not.toHaveBeenCalled();
        expect(allSpy).not.toHaveBeenCalled();

        // Act - Add first url
        urls.value = [alice.requireUrl()];
        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(modelUrls(users)).toEqual([alice.url]);
        expect(findSpy).toHaveBeenCalledTimes(1);
        expect(findSpy).toHaveBeenCalledWith(alice.url, { includeSoftDeleted: true });

        // Act - Mutate array in-place to add second url
        urls.value.push(bob.requireUrl());
        await nextTick();
        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(modelUrls(users)).toEqual([alice.url, bob.url]);
        expect(findSpy).toHaveBeenCalledTimes(2);
        expect(findSpy).toHaveBeenLastCalledWith(bob.url, { includeSoftDeleted: true });

        // Act - Shrink urls ref to already-loaded model
        urls.value = [bob.requireUrl()];
        await nextTick();

        // Assert
        expect(modelUrls(users)).toEqual([bob.url]);
        expect(findSpy).toHaveBeenCalledTimes(2);
        expect(allSpy).not.toHaveBeenCalled();
    });

    it('Reacts to changes in a urls getter', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const urls = ref([alice.requireUrl()]);
        const { models: users, loading } = useModels(User, { only: () => urls.value });

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Act
        urls.value = [bob.requireUrl()];

        const loadingAfterChange = loading.value;

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(loadingAfterChange).toBe(true);
        expect(modelUrls(users)).toEqual([bob.url]);
    });

    it('Keeps loading true until the latest urls ref update finishes', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const bob = await User.create({ name: 'Bob', age: 30 });
        const { findSpy, resolve } = deferUserFind([alice.requireUrl(), bob.requireUrl()]);
        const urls = ref([alice.requireUrl()]);

        // Act
        const { models: users, loading } = useModels(User, { only: urls });

        expect(loading.value).toBe(true);

        urls.value = [bob.requireUrl()];
        await nextTick();

        expect(loading.value).toBe(true);

        // Resolve the first request while the second is still pending
        resolve(alice.requireUrl());
        await findSpy.mock.results[0]?.value;
        await after(0);

        expect(loading.value).toBe(true);

        resolve(bob.requireUrl());
        await vi.waitFor(() => expect(loading.value).toBe(false));

        expect(modelUrls(users)).toEqual([bob.url]);
    });

    it('Replaces tracked models with newer ones when loading urls', async () => {
        // Arrange
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

        const alice = await User.create({ name: 'Alice', age: 23 });
        const staleAlice = await User.find(alice.requireUrl());

        vi.setSystemTime(new Date('2026-01-02T00:00:00Z'));

        await alice.update({ name: 'Alice Cooper' });

        const { resolve } = deferUserFind([alice.requireUrl()]);

        // Act
        const { loading } = useModels(User, { only: [alice.requireUrl()] });

        getTrackedModelsData(User).modelsMap.add(staleAlice as User & { url: string });
        resolve(alice.requireUrl());

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(getTrackedModels(User).map((user) => user.name)).toEqual(['Alice Cooper']);
    });

    it('Keeps tracked models when loaded urls are not newer', async () => {
        // Arrange
        const alice = await User.create({ name: 'Alice', age: 23 });
        const { resolve } = deferUserFind([alice.requireUrl()]);

        // Act
        const { loading } = useModels(User, { only: [alice.requireUrl()] });

        getTrackedModelsData(User).modelsMap.add(alice as User & { url: string });
        resolve(alice.requireUrl());

        await vi.waitFor(() => expect(loading.value).toBe(false));

        // Assert
        expect(getTrackedModels(User)).toHaveLength(1);
        expect(getTrackedModels(User)[0]).toBe(alice);
    });

    function modelUrls(models: { value: Array<{ url: string }> }): string[] {
        return models.value.map((model) => model.url);
    }

    function deferUserFind(urls: string[]) {
        const resolvers = new Map<string, () => void>();
        const originalFind = User.find.bind(User);
        const findSpy = vi.spyOn(User, 'find').mockImplementation((url: string, options) => {
            if (!urls.includes(url)) {
                return originalFind(url, options);
            }

            return new Promise((resolve) => {
                resolvers.set(url, () => resolve(originalFind(url, options)));
            });
        });

        return {
            findSpy,
            resolve: (url: string) => resolvers.get(url)?.(),
        };
    }
});
