import { bold, hex } from 'chalk';
import { describe, it } from 'vitest';

import LogMock from '@/lib/Log.mock';

import Log from './Log';

describe('Log', () => {

    it('renders markdown bold', () => {
        // Arrange
        const info = hex('#00ffff');

        // Act
        Log.info('Foo **bar**');

        // Assert
        LogMock.expectLogged(info(`Foo ${bold('bar')}`));
    });

});
