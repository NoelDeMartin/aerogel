/* eslint-disable max-len */
import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './markdown';

describe('Markdown utils', () => {

    it('renders basic markdown', () => {
        // Arrange
        const expectedHTML = `
            <h1>Title</h1>
            <p>body with <a target="_blank" href="https://example.com">link</a></p>
            <ul>
                <li>One</li>
                <li>Two</li>
                <li>Three</li>
            </ul>
        `;

        // Act
        const html = renderMarkdown(
            ['# Title', 'body with [link](https://example.com)', '- One', '- Two', '- Three'].join('\n'),
        );

        // Assert
        expect(normalizeHTML(html)).toMatch(new RegExp(normalizeHTML(expectedHTML)));
    });

    it('renders button links', () => {
        // Arrange
        const expectedHTML = `
            <p><button type="button" data-markdown-action="do-something">link</button></p>
        `;

        // Act
        const html = renderMarkdown('[link](#action:do-something)');

        // Assert
        expect(normalizeHTML(html)).toMatch(new RegExp(normalizeHTML(expectedHTML)));
    });

});

function normalizeHTML(html: string): string {
    return html
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}
