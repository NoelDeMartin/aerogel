import { computedModelAttribute } from '@aerogel/reactivity/composables/computedModelAttribute';
import Post from '@aerogel/reactivity/testing/stubs/models/Post';
import { describe, expect, it } from 'vite-plus/test';
import { nextTick, shallowRef, watchEffect } from 'vue';

describe('computedModelAttribute', () => {
    it('Updates when the model changes', async () => {
        // Arrange
        const hello = await Post.create({ title: 'Hello' });
        const helloWorld = await Post.create({ title: 'Hello World' });
        const post = shallowRef(hello);
        const titleLength = computedModelAttribute(post, 'titleLength');
        const titleLengths: unknown[] = [];

        await hello.loadComputedAttributes();
        await helloWorld.loadComputedAttributes();

        watchEffect(() => titleLengths.push(titleLength.value));

        // Act
        post.value = helloWorld;

        await nextTick();

        // Assert
        expect(titleLengths).toEqual([5, 11]);
    });
});
