import { normalizeSparql, normalizeTurtle } from '@noeldemartin/solid-utils';
import { sparqlEquals, turtleEquals } from '@noeldemartin/solid-utils/testing';
import { expect as baseExpect } from '@playwright/test';

export const expect = baseExpect.extend({
    toEqualSparql(received: unknown, expected: string) {
        const actual = String(received ?? '');
        const result = sparqlEquals(expected, actual);

        return {
            pass: result.success,
            message: () => {
                if (result.success) {
                    return 'Expected SPARQL not to match.';
                }

                return [result.message, '', this.utils.diff(normalizeSparql(expected), normalizeSparql(actual))].join(
                    '\n',
                );
            },
        };
    },
    toEqualTurtle(received: unknown, expected: string) {
        const actual = String(received ?? '');
        const result = turtleEquals(expected, actual);

        return {
            pass: result.success,
            message: () => {
                if (result.success) {
                    return 'Expected Turtle not to match.';
                }

                return [result.message, '', this.utils.diff(normalizeTurtle(expected), normalizeTurtle(actual))].join(
                    '\n',
                );
            },
        };
    },
});
