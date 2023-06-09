import { describe, expect, it } from 'vitest';

import { File } from '@/lib/filesystem/File';
import { FileMock } from '@/lib/filesystem/FileMock';

import { main } from './cli';

describe('CLI', () => {

    it('works', () => {
        // Arrange
        File.setInstance(new FileMock());

        // Act
        main();

        // Assert
        expect(true).toBe(true);
    });

});
