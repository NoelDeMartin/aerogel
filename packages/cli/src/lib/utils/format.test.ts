import { describe, expect, it } from 'vitest';

import { formatCodeBlock } from './format';

describe('Format utils', () => {

    it('Formats code blocks', () => {
        // Arrange
        const raw = `

            const foo = 'bar';

            if (foo) {
                doSomething();
            }

        `;
        const formatted = [
            'const foo = \'bar\';', //
            '', //
            'if (foo) {', //
            '    doSomething();', //
            '}', //
        ].join('\n');

        // Act
        const actual = formatCodeBlock(raw);

        // Assert
        expect(actual).toEqual(formatted);
    });

});
