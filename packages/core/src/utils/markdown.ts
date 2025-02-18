import DOMPurify from 'dompurify';
import { stringMatchAll, tap } from '@noeldemartin/utils';
import { Renderer, marked } from 'marked';

function makeRenderer(): Renderer {
    return tap(new Renderer(), (renderer) => {
        renderer.link = function(href, title, text) {
            return Renderer.prototype.link.apply(this, [href, title, text]).replace('<a', '<a target="_blank"');
        };
    });
}

function renderActionLinks(html: string): string {
    const matches = stringMatchAll<3>(html, /<a[^>]*href="#action:([^"]+)"[^>]*>([^<]+)<\/a>/g);

    for (const [link, action, text] of matches) {
        html = html.replace(link, `<button type="button" data-markdown-action="${action}">${text}</button>`);
    }

    return html;
}

export function renderMarkdown(markdown: string): string {
    let html = marked(markdown, { mangle: false, headerIds: false, renderer: makeRenderer() });

    html = safeHtml(html);
    html = renderActionLinks(html);

    return html;
}

export function safeHtml(html: string): string {
    // TODO improve target="_blank" exception
    // See https://github.com/cure53/DOMPurify/issues/317
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}
