import { guessMediaType } from '@/lib/media-types';
import { describe, expect, it } from 'vitest';

describe('Media Types helpers', () => {

    it('guesses media types from filenames', () => {
        expect(guessMediaType('foo.png')).toBe('image/png');
        expect(guessMediaType('foo.bar.png')).toBe('image/png');
        expect(guessMediaType('foo.jpg')).toBe('image/jpeg');
        expect(guessMediaType('foo.jpeg')).toBe('image/jpeg');
        expect(guessMediaType('foo')).toBeNull();
    });

});
