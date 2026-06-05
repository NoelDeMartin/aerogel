import { normalizeSparql } from '@noeldemartin/solid-utils';
import { sparqlEquals } from '@noeldemartin/solid-utils/testing';
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

                return [
                    result.message,
                    `- Expected: ${this.utils.printExpected(normalizeSparql(expected))}`,
                    `+ Received: ${this.utils.printReceived(normalizeSparql(actual))}`,
                ].join('\n');
            },
        };
    },
});
