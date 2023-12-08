import { describe, expect, it } from 'vitest';

import { removeInteractiveClasses } from './tailwindcss';

describe('TailwindCSS utils', () => {

    it('Removes interactive classes', () => {
        const cases: [string, string][] = [
            ['text-red hover:text-green', 'text-red'],
            ['text-red hover:text-green text-lg', 'text-red text-lg'],
            [
                `
                    text-red text-lg
                    focus:text-yellow
                    hover:focus:text-black
                `,
                'text-red text-lg',
            ],
        ];

        cases.forEach(([original, expected]) => {
            expect(removeInteractiveClasses(original)).toEqual(expected);
        });
    });

});
