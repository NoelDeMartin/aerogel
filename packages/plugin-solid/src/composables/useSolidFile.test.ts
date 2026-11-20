import { Events } from '@aerogel/core';
import Solid from '@aerogel/plugin-solid/services/Solid';
import { PromisedValue, after } from '@noeldemartin/utils';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { effectScope, ref } from 'vue';

import { useSolidFile } from './useSolidFile';

describe('useSolidFile', () => {
    let objectUrls: number;

    beforeEach(() => {
        objectUrls = 0;

        vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:${++objectUrls}`);
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    });

    it('creates and revokes object urls', async () => {
        // Arrange
        const readFileIfExists = vi
            .spyOn(Solid.requireInstance(), 'readFileIfExists')
            .mockImplementation(async (url) => new Blob([url]));
        const fileUrl = ref<string | null>('https://alice.example/first.png');
        const scope = effectScope();
        const file = scope.run(() => useSolidFile(fileUrl));

        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:1'));

        // Act
        fileUrl.value = 'https://alice.example/second.png';

        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:2'));

        scope.stop();

        // Assert
        expect(readFileIfExists).toHaveBeenCalledTimes(2);
        expect(await file?.blob.value?.text()).toEqual('https://alice.example/second.png');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:2');
    });

    it.each(['solid:file-uploaded', 'solid:file-updated'] as const)('reloads files on %s events', async (event) => {
        // Arrange
        const url = 'https://alice.example/image.png';
        const readFileIfExists = vi
            .spyOn(Solid.requireInstance(), 'readFileIfExists')
            .mockImplementation(async () => new Blob(['image']));
        const scope = effectScope();
        const file = scope.run(() => useSolidFile(url));

        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:1'));

        // Act
        await Events.emit(event, { url });
        await Events.emit(event, { url: 'https://alice.example/other.png' });

        // Assert
        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:2'));

        expect(readFileIfExists).toHaveBeenCalledTimes(2);

        scope.stop();
    });

    it('clears deleted files', async () => {
        // Arrange
        const url = 'https://alice.example/image.png';
        const scope = effectScope();
        const readFileIfExists = vi
            .spyOn(Solid.requireInstance(), 'readFileIfExists')
            .mockResolvedValue(new Blob(['image']));
        const file = scope.run(() => useSolidFile(url));

        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:1'));

        // Act
        await Events.emit('solid:file-deleted', { url });

        // Assert
        expect(file?.url.value).toBeUndefined();
        expect(file?.blob.value).toBeNull();
        expect(readFileIfExists).toHaveBeenCalledOnce();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:1');

        scope.stop();
    });

    it('ignores stale loads', async () => {
        // Arrange
        const firstUrl = 'https://alice.example/first.png';
        const secondUrl = 'https://alice.example/second.png';
        const firstRead = new PromisedValue<Blob | null>();
        const fileUrl = ref(firstUrl);
        const scope = effectScope();

        vi.spyOn(Solid.requireInstance(), 'readFileIfExists').mockImplementation((url) =>
            url === firstUrl ? firstRead : Promise.resolve(new Blob(['second'])),
        );

        const file = scope.run(() => useSolidFile(fileUrl));

        fileUrl.value = secondUrl;

        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:1'));

        // Act
        firstRead.resolve(new Blob(['first']));

        await after();

        // Assert
        expect(file?.url.value).toEqual('blob:1');
        expect(await file?.blob.value?.text()).toEqual('second');
        expect(file?.loading.value).toBe(false);
        expect(URL.createObjectURL).toHaveBeenCalledTimes(1);

        scope.stop();
    });

    it('ignores loads completed after disposal', async () => {
        // Arrange
        const read = new PromisedValue<Blob | null>();
        const scope = effectScope();

        vi.spyOn(Solid.requireInstance(), 'readFileIfExists').mockReturnValue(read);

        const file = scope.run(() => useSolidFile('https://alice.example/image.png'));

        scope.stop();

        // Act
        read.resolve(new Blob(['image']));

        await after();

        // Assert
        expect(file?.url.value).toBeUndefined();
        expect(URL.createObjectURL).not.toHaveBeenCalled();
    });
});
