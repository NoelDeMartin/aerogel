import { Events } from '@aerogel/core';
import Solid from '@aerogel/plugin-solid/services/Solid';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { effectScope, ref } from 'vue';

import { useSolidFile } from './useSolidFile';

describe('useSolidFile', () => {
    let objectUrls: number;

    beforeEach(() => {
        objectUrls = 0;

        vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:${++objectUrls}`);
        vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    });

    afterEach(() => vi.restoreAllMocks());

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

    it('reloads updated files', async () => {
        // Arrange
        const url = 'https://alice.example/image.png';
        const readFileIfExists = vi
            .spyOn(Solid.requireInstance(), 'readFileIfExists')
            .mockImplementation(async () => new Blob(['image']));
        const scope = effectScope();
        const file = scope.run(() => useSolidFile(url));

        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:1'));

        // Act
        await Events.emit('solid:file-uploaded', { url });
        await Events.emit('solid:file-uploaded', { url: 'https://alice.example/other.png' });

        // Assert
        await vi.waitFor(() => expect(file?.url.value).toEqual('blob:2'));

        expect(readFileIfExists).toHaveBeenCalledTimes(2);

        scope.stop();
    });
});
