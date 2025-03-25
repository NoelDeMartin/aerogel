import { createApp } from 'vue';
import { describe, expect, it } from 'vitest';
import { Errors, bootServices } from '@aerogel/core';
import { Metadata } from 'soukai-solid';
import { requireBootedModel } from 'soukai';

import solid from './index';

describe('Solid plugin', () => {

    it('Initializes models', async () => {
        // Arrange
        const app = createApp({});

        await bootServices(app, { $errors: Errors });

        // Act
        await solid().install(app, {});

        // Assert
        expect(requireBootedModel('Metadata')).toEqual(Metadata);
    });

});
