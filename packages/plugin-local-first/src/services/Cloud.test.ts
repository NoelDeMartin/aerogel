import { CloudService } from '@aerogel/plugin-local-first/services/Cloud';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import PostsCollection from '@aerogel/plugin-local-first/testing/stubs/models/PostsCollection';
import { useModels } from '@aerogel/plugin-solid';
import type { Model } from 'soukai-bis';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

class TestCloudService extends CloudService {
    public override getDirtyLocalModels(): Promise<Model[]> {
        return super.getDirtyLocalModels();
    }
}

describe('Cloud', () => {
    let cloud: TestCloudService;

    beforeEach(() => (cloud = new TestCloudService()));

    it('finds dirty models in registered containers', async () => {
        // Arrange
        await cloud.track(PostsCollection, { register: true });
        await cloud.track(Post);

        cloud.setState({ ready: true, autoPush: false });

        const collection = await PostsCollection.create({ name: 'Drafts' });
        const post = await collection.relatedPosts.create({ title: 'Hello' });

        // Act
        const models = await cloud.getDirtyLocalModels();

        // Assert
        expect(models.map((model) => [model.static().modelName, model.url])).toEqual([
            ['PostsCollection', collection.url],
            ['Post', post.url],
        ]);
    });

    it('ignores dirty models whose documents were deleted', async () => {
        // Arrange
        await cloud.track(Post);

        cloud.setState({ ready: true, autoPush: false });

        const post = await Post.create({ title: 'Hello' });

        await post.delete();

        // Act
        const models = await cloud.getDirtyLocalModels();

        // Assert
        expect(models).toHaveLength(0);
    });

    it('loads registered collections with their depth', async () => {
        // Arrange
        const post = await new Post({ title: 'Nested' }).save(`${Post.defaultContainerUrl}nested/`);

        await cloud.track(Post, { register: { depth: 1 } });

        // Act
        const { models: posts } = useModels(Post);

        // Assert
        await vi.waitFor(() => expect(posts.value.map((model) => model.url)).toEqual([post.url]));
    });
});
