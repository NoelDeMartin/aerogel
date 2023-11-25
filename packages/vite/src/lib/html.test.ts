import { describe, expect, it } from 'vitest';

import { renderHTML } from './html';

describe('HTML helpers', () => {

    it('Evaluates app info', () => {
        // Arrange
        const html = '<title>{{ app.name }}</title>';
        const expected = '<title>My App</title>';

        // Act
        const actual = renderHTML(html, '/var/www/index.html', { app: { name: 'My App' } });

        // Assert
        expect(actual).toEqual(expected);
    });

    it('Evaluates helpers', () => {
        // Arrange
        const html = `
            {{ css('./inline-styles.css') }}
            {{ js('./inline-script.js') }}
            {{ svg('./inline-svg.svg') }}
        `;
        const expected = `
            <style>file-source[/var/www/inline-styles.css]</style>
            <script>file-source[/var/www/inline-script.js]</script>
            file-source[/var/www/inline-svg.svg]
        `;

        // Act
        const actual = renderHTML(html, '/var/www/index.html');

        // Assert
        expect(actual).toEqual(expected);
    });

});
