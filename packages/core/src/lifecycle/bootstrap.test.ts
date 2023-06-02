import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from 'vue';
import { createI18n } from 'vue-i18n';
import { IndexedDBEngine, requireBootedModel, requireEngine } from 'soukai';
import { mock } from '@noeldemartin/utils';
import type { Component } from 'vue';

import User from '@/testing/stubs/models/User';

import { bootstrapApplication } from './bootstrap';

describe('Aerogel', () => {

    beforeEach(() => {
        vi.mock('vue', () => ({
            createApp: vi.fn(() => ({
                mount: vi.fn(),
                use: vi.fn(),
            })),
        }));
    });

    it('Mounts the Vue application', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent);

        // Assert
        expect(createApp).toHaveBeenCalledWith(rootComponent);
        expect(vi.mocked(createApp).mock.results[0]?.value.mount).toHaveBeenCalled();
    });

    it('Initializes Soukai', async () => {
        // Arrange
        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent, {
            models: import.meta.glob('@/testing/stubs/models/*', { eager: true }),
        });

        // Assert
        expect(requireBootedModel('User')).toEqual(User);
        expect(requireEngine()).toBeInstanceOf(IndexedDBEngine);
    });

    it('Initializes routes', async () => {
        // Arrange
        vi.mock('vue-router', () => ({
            createRouter: vi.fn(() => ({ routerMock: true })),
            createWebHistory: vi.fn(),
        }));

        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent, {
            routes: [],
        });

        // Assert
        expect(vi.mocked(createApp).mock.results[0]?.value.use).toHaveBeenCalledWith({ routerMock: true });
    });

    it('Initializes lang', async () => {
        // Arrange
        vi.mock('vue-i18n', () => ({ createI18n: vi.fn(() => ({ i18nMock: true })) }));

        const rootComponent = mock<Component>();

        // Act
        await bootstrapApplication(rootComponent, {
            langMessages: import.meta.glob('@/testing/stubs/lang/*'),
        });

        // Assert
        const mockedCreateI18n = vi.mocked(createI18n);
        const mockedCreateApp = vi.mocked(createApp);

        expect(mockedCreateI18n).toHaveBeenCalled();
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages).key('en').to.exist;
        expect(mockedCreateI18n.mock.calls[0]?.[0].messages?.['en']).key('foo').to.exist;
        expect(mockedCreateApp.mock.results[0]?.value.use).toHaveBeenCalledWith({ i18nMock: true });
    });

});
