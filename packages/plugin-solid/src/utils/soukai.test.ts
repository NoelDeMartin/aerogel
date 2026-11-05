import { describe, expect, it } from 'vite-plus/test';

import { createGlobalAsyncContextManager } from './soukai';

describe('Soukai utils', () => {
    it('runs operations with values', async () => {
        // Arrange
        const manager = createGlobalAsyncContextManager<string>();

        // Act
        const syncValue = manager.runWithValue('sync', () => manager.getValue());
        const asyncValue = await manager.runWithValue('async', async () => {
            await Promise.resolve();

            return manager.getValue();
        });
        const nestedValues = manager.runWithValue('outer', () => [
            manager.runWithValue('inner', () => manager.getValue()),
            manager.getValue(),
        ]);

        // Assert
        expect(syncValue).toEqual('sync');
        expect(asyncValue).toEqual('async');
        expect(nestedValues).toEqual(['inner', 'outer']);
        expect(manager.getValue()).toBeUndefined();
    });

    it('clears values when operations fail', async () => {
        // Arrange
        const manager = createGlobalAsyncContextManager<string>();

        // Act
        const syncFailure = () =>
            manager.runWithValue('sync', () => {
                throw new Error('Failed');
            });
        const asyncFailure = manager.runWithValue('async', () => Promise.reject(new Error('Failed')));

        // Assert
        expect(syncFailure).toThrow('Failed');
        await expect(asyncFailure).rejects.toThrow('Failed');
        expect(manager.getValue()).toBeUndefined();
    });
});
