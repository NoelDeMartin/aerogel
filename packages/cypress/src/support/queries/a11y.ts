import { prepareQuery, queryAlias } from './helpers';
import type { Query, QueryOptions } from './helpers';

export function a11yGet(this: Cypress.Command, text: string, options: QueryOptions = {}): Query {
    // TODO read from aria-labelledby and ignore aria-hidden
    const query = prepareQuery(this, options);
    const getByContent = query.subquery('contains', text);
    const getByAriaLabel = query.subquery('get', `[aria-label="${text}"]`);

    return (subject) => query.execute(subject, getByContent, getByAriaLabel);
}

export function ariaInput(this: Cypress.Command, label: string, options: QueryOptions = {}): Query {
    const query = prepareQuery(this, options);
    const getDocument = query.subquery<Document>('document');
    const getByContent = query.subquery('contains', label);
    const getInputByAriaLabel = query.subquery('get', `input[aria-label="${label}"]`);
    const getInputByContent = (subject: Cypress.PrevSubject) => {
        const $labelElement = getByContent(subject);
        const $inputElement =
            $labelElement[0]?.querySelector('input, textarea') ??
            getDocument(subject).getElementById($labelElement[0]?.getAttribute('for') ?? '');

        if ($inputElement) {
            return Cypress.dom.wrap($inputElement);
        }

        return cy.$$(null as unknown as string);
    };

    return (subject) => query.execute(subject, getInputByContent, getInputByAriaLabel);
}

export function ariaLabel(this: Cypress.Command, label: string, options: QueryOptions = {}): Query {
    return queryAlias(this, ['get', `[aria-label="${label}"]`], options);
}
