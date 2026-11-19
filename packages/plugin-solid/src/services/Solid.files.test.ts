import { Events, NetworkCache } from '@aerogel/core';
import Gallery from '@aerogel/plugin-solid/testing/stubs/models/Gallery';
import { computedModelAttribute } from '@aerogel/plugin-solid/utils/composition';
import { watchContainerFiles } from '@aerogel/plugin-solid/utils/internal';
import { getTrackedModels, resetModelsState, trackModels } from '@aerogel/plugin-solid/utils/services';
import { Container, DocumentNotFound, InMemoryEngine, SolidEngine, setEngine, setRemoteEngine } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { effectScope, nextTick } from 'vue';

import { SolidService } from './Solid';

class FakeCache {
    public responses = new Map<string, Blob>();

    public async match(url: string): Promise<Response | undefined> {
        const blob = this.responses.get(url);

        return blob && new Response(blob);
    }

    public async put(url: string, response: Response): Promise<void> {
        this.responses.set(url, await response.blob());
    }

    public async keys(): Promise<string[]> {
        return Array.from(this.responses.keys());
    }

    public async delete(url: string): Promise<boolean> {
        return this.responses.delete(url);
    }
}

describe('Solid files', () => {
    let solid: SolidService;
    let engine: InMemoryEngine;
    let cache: FakeCache;

    beforeEach(async () => {
        cache = new FakeCache();
        engine = new InMemoryEngine();
        solid = new SolidService();

        solid.setState({ profiles: {}, staleProfiles: [], previousSession: null, session: null });
        setEngine(engine);
        resetModelsState();
        watchContainerFiles();
        vi.unstubAllGlobals();
        vi.stubGlobal('caches', { open: async () => cache, delete: async () => true });

        await NetworkCache.clear();
    });

    it('emits events when uploading files to local containers', async () => {
        // Arrange
        const containerUrl = 'https://alice.example/gallery/';
        const gallery = await new Gallery({ name: 'Holidays' }).save({ containerUrl });
        const uploadedUrls: string[] = [];

        await gallery.loadRelation('container');

        Events.on('solid:file-uploaded', ({ url }) => uploadedUrls.push(url));

        // Act
        const url = await gallery.relatedContainer.uploadFile(new File(['image'], 'image.png', { type: 'image/png' }));

        // Assert
        expect(url).toEqual(`${containerUrl}image.png`);
        expect(await (await engine.readFile(url)).text()).toEqual('image');
        expect(await engine.getDocumentLocalChanges(url)).toEqual({
            resources: { [url]: { createdAt: expect.any(Date) } },
        });
        expect(uploadedUrls).toEqual([url]);
        expect(cache.responses.size).toEqual(0);
    });

    it('caches files uploaded to remote containers', async () => {
        // Arrange
        const containerUrl = 'https://alice.example/gallery/';
        const url = `${containerUrl}image.png`;
        const fetch = vi.fn(async (_: string, init?: RequestInit) =>
            init?.method === 'PUT'
                ? new Response(null, { status: 201 })
                : new Response(
                      `<> a <http://www.w3.org/ns/ldp#Container> ; <http://www.w3.org/ns/ldp#contains> <${url}> .`,
                      {
                          headers: { 'Content-Type': 'text/turtle' },
                      },
                  ),
        );

        setEngine(new SolidEngine({ fetch }));

        const container = Container.newInstance({ url: containerUrl }, { exists: true });

        // Act
        await container.uploadFile(new Blob(['image'], { type: 'image/png' }), { slug: 'image.png' });

        // Assert
        expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({ method: 'PUT' }));
        expect(await cache.responses.get(url)?.text()).toEqual('image');
    });

    it('refreshes computed attributes of tracked models', async () => {
        // Arrange
        const containerUrl = 'https://alice.example/gallery/';

        await trackModels(Gallery, { bypassServicesCheck: true, lazy: true });
        await new Gallery({ name: 'Holidays' }).save({ containerUrl });

        const gallery = getTrackedModels(Gallery)[0];
        const scope = effectScope();
        const imageUrls = scope.run(() => computedModelAttribute(gallery, 'imageUrls'));

        await vi.waitFor(() => expect(imageUrls?.value).toEqual([]));
        await gallery?.loadRelation('container');

        // Act
        const url = await gallery?.relatedContainer.uploadFile(new File(['image'], 'image.png', { type: 'image/png' }));

        await nextTick();

        // Assert
        await vi.waitFor(() => expect(imageUrls?.value).toEqual([url]));

        scope.stop();
    });

    it('reads files from the local engine', async () => {
        // Arrange
        const url = 'local://gallery/image.png';

        await engine.writeFile(url, new Blob(['image']));

        // Act
        const blob = await solid.readFileIfExists(url);

        // Assert
        expect(await blob?.text()).toEqual('image');
    });

    it('ignores files deleted locally', async () => {
        // Arrange
        const url = 'https://alice.example/gallery/image.png';
        const fetch = vi.fn(async () => new Response('image'));

        setRemoteEngine(new SolidEngine({ fetch }));

        await engine.writeFile(url, new Blob(['image']), { lastModifiedAt: new Date() });
        await engine.deleteFile(url, { localChanges: () => ({ resources: { [url]: { deletedAt: new Date() } } }) });

        // Act
        const blob = await solid.readFileIfExists(url);

        // Assert
        expect(blob).toBeNull();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('fails reading missing files', async () => {
        // Arrange
        const url = 'https://alice.example/gallery/image.png';

        setRemoteEngine(new SolidEngine({ fetch: async () => new Response(null, { status: 404 }) }));

        // Act & Assert
        await expect(solid.readFile(url)).rejects.toThrow(DocumentNotFound);
        expect(await solid.readFileIfExists(url)).toBeNull();
    });

    it('reads and caches remote files', async () => {
        // Arrange
        const url = 'https://alice.example/gallery/image.png';
        const fetch = vi.fn(async () => new Response('image', { headers: { 'Content-Type': 'image/png' } }));

        setRemoteEngine(new SolidEngine({ fetch }));

        // Act
        const blob = await solid.readFileIfExists(url);
        const cachedBlob = await solid.readFileIfExists(url);

        // Assert
        expect(await blob?.text()).toEqual('image');
        expect(await cachedBlob?.text()).toEqual('image');
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('deletes files', async () => {
        // Arrange
        const gallery = await new Gallery({ name: 'Holidays' }).save({
            containerUrl: 'https://alice.example/gallery/',
        });

        await gallery.loadRelation('container');

        const url = await gallery.relatedContainer.uploadFile(new File(['image'], 'image.png'));
        const deletedUrls: string[] = [];

        await cache.put(url, new Response('image'));

        Events.on('solid:file-deleted', ({ url: deletedUrl }) => deletedUrls.push(deletedUrl));

        // Act
        await gallery.relatedContainer.deleteFile(url);

        // Assert
        expect(await engine.getFile(url)).toBeNull();
        expect(cache.responses.has(url)).toBe(false);
        expect(deletedUrls).toEqual([url]);
    });
});
