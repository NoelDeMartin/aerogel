import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function renderMarkdown(markdown: string): string {
    return safeHtml(marked(markdown));
}

export function safeHtml(html: string): string {
    // TODO improve target="_blank" exception
    // See https://github.com/cure53/DOMPurify/issues/317
    return DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}
