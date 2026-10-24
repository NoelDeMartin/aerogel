import { formatCodeBlock } from '@noeldemartin/utils';
import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { generateModelsDeclaration } from './soukai';

vi.mock('fs', async () => {
    const { fs } = await import('memfs');

    return { ...fs, default: fs };
});

describe('Soukai helpers', () => {
    beforeEach(() => vol.reset());

    it('Generates models declaration', () => {
        // Arrange
        vol.fromJSON(
            {
                'src/models/Person.ts': 'export default class {}',
                'src/models/Person.schema.ts': 'export default class {}',
                'src/models/Person.test.ts': '',
                'src/models/index.ts': '',
                'src/models/Task.ts': 'export default interface Task {}',
                'src/modules/movies/models/Movie.ts': 'export default class {}',
                'src/modules/movies/models/Movie.schema.ts': 'export default class {}',
                'src/modules/shows/models/Episode.ts': 'export default class {}',
                'src/modules/shows/pages/Index.vue': '',
            },
            '/app',
        );

        // Act
        generateModelsDeclaration('/app');

        // Assert
        expect(vol.readFileSync('/app/src/types/models.d.ts', 'utf-8')).toContain(
            formatCodeBlock(`
                declare module 'soukai-bis' {
                    export interface ModelsRegistry {
                        Episode: typeof import('../modules/shows/models/Episode')['default']
                        Movie: typeof import('../modules/movies/models/Movie')['default']
                        Person: typeof import('../models/Person')['default']
                    }
                }
            `),
        );
    });

    it('Skips models declaration without models', () => {
        // Arrange
        vol.fromJSON({ 'src/main.ts': '' }, '/app');

        // Act
        generateModelsDeclaration('/app');

        // Assert
        expect(vol.existsSync('/app/src/types/models.d.ts')).toBe(false);
    });

    it('Removes stale models declaration without models', () => {
        // Arrange
        vol.fromJSON({ 'src/main.ts': '', 'src/types/models.d.ts': 'stale' }, '/app');

        // Act
        generateModelsDeclaration('/app');

        // Assert
        expect(vol.existsSync('/app/src/types/models.d.ts')).toBe(false);
    });
});
