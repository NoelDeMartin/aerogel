import { Events, NetworkCache } from '@aerogel/core';
import Gallery from '@aerogel/plugin-solid/testing/stubs/models/Gallery';
import { computedModelAttribute, getTrackedModels, resetReactiveState, trackModels } from '@aerogel/reactivity';
import { invade } from '@noeldemartin/utils';
import {
    Container,
    DocumentNotFound,
    InMemoryEngine,
    SolidEngine,
    setEngine,
    setRemoteEngine,
    trackLocalChanges,
} from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { effectScope } from 'vue';

import { SolidService } from './Solid';

describe('Solid files', () => {
    let solid: SolidService;
    let engine: InMemoryEngine;

    beforeEach(() => {
        engine = new InMemoryEngine();
        solid = new SolidService();

        solid.setState({ profiles: {}, staleProfiles: [], previousSession: null, session: null });
        setEngine(engine);
        resetReactiveState();
        invade(solid, ['watchContainerFiles']).watchContainerFiles();
    });

    it('emits events when uploading files to local containers', async () => {
        // Arrange
        const containerUrl = 'https://alice.example/gallery/';
        const gallery = await new Gallery({ name: 'Holidays' }).save({ containerUrl });
        const uploadedUrls: string[] = [];

        trackLocalChanges(Gallery);

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
        expect(await NetworkCache.get(url)).toBeNull();
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
        expect(await (await NetworkCache.get(url))?.text()).toEqual('image');
    });

    it('refreshes computed attributes of tracked models', async () => {
        // Arrange
        const containerUrl = 'https://alice.example/gallery/';

        trackModels(Gallery);
        await new Gallery({ name: 'Holidays' }).save({ containerUrl });

        const gallery = getTrackedModels(Gallery)[0];
        const scope = effectScope();
        const imageUrls = scope.run(() => computedModelAttribute(gallery, 'imageUrls'));

        await vi.waitFor(() => expect(imageUrls?.value).toEqual([]));
        await gallery?.loadRelation('container');

        // Act
        const url = await gallery?.relatedContainer.uploadFile(new File(['image'], 'image.png', { type: 'image/png' }));

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

        await NetworkCache.store(url, new Response('image'));

        Events.on('solid:file-deleted', ({ url: deletedUrl }) => deletedUrls.push(deletedUrl));

        // Act
        await gallery.relatedContainer.deleteFile(url);

        // Assert
        expect(await engine.getLocalFile(url)).toBeNull();
        expect(await NetworkCache.get(url)).toBeNull();
        expect(deletedUrls).toEqual([url]);
    });
});
