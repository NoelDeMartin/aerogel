import chalk from 'chalk';
import { describe, it } from 'vitest';

import LogMock from '@aerogel/cli/lib/Log.mock';

import Log from './Log';

const info = chalk.hex('#00ffff');

describe('Log', () => {

    it('renders markdown bold', () => {
        // Act
        Log.info('Foo **bar**');

        // Assert
        LogMock.expectLogged(info(`Foo ${chalk.bold('bar')}`));
    });

    it('renders multiline messages', () => {
        // Act
        Log.info(`
            This is multiline,
                but the indentation should be respected.

            As well as the new lines.
        `);

        // Assert
        LogMock.expectLogLength(4);
        LogMock.expectLogged(info('This is multiline,'));
        LogMock.expectLogged(info('    but the indentation should be respected.'));
        LogMock.expectLogged(info(''));
        LogMock.expectLogged(info('As well as the new lines.'));
    });

});
