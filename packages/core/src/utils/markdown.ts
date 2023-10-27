import { tap } from '@noeldemartin/utils';
import DOMPurify from 'dompurify';
import { Renderer, marked } from 'marked';

function makeRenderer(): Renderer {
    return tap(new Renderer(), (renderer) => {
        renderer.link = function(href, title, text) {
            return Renderer.prototype.link.apply(this, [href, title, text]).replace('<a', '<a target="_blank"');
        };
    });
}

export function renderMarkdown(markdown: string): string {
    return safeHtml(marked(markdown, { mangle: false, headerIds: false, renderer: makeRenderer() }));
}

export function safeHtml(html: string): string {
    // TODO improve target="_blank" exception
    // See https://github.com/cure53/DOMPurify/issues/317
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}
