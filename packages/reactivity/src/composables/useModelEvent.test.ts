import { useModelEvent } from '@aerogel/reactivity/composables/useModelEvent';
import User from '@aerogel/reactivity/testing/stubs/models/User';
import { describe, expect, it } from 'vite-plus/test';
import { effectScope } from 'vue';

describe('useModelEvent', () => {
    it('Listens to model events until the scope is disposed', async () => {
        // Arrange
        const createdNames: string[] = [];
        const scope = effectScope();

        scope.run(() => useModelEvent(User, 'created', ({ model }) => createdNames.push(model.name)));

        // Act
        await User.create({ name: 'Alice', age: 23 });

        scope.stop();

        await User.create({ name: 'Bob', age: 30 });

        // Assert
        expect(createdNames).toEqual(['Alice']);
    });
});
