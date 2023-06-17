import { prepareQuery, queryAlias } from '@cy/support/queries/helpers';
import type { Query, QueryOptions } from '@cy/support/queries/helpers';

export function a11yGet(text: string, options: QueryOptions = {}): Query {
    // TODO read from aria-label, aria-labelledby, and ignore aria-hidden

    return queryAlias(this, ['contains', text], options);
}

export function ariaInput(label: string, options: QueryOptions = {}): Query {
    const query = prepareQuery(this, options);
    const getDocument = query.subquery<Document>('document');
    const getByContent = query.subquery('contains', label);
    const getInputByAriaLabel = query.subquery('get', `input[aria-label="${label}"]`);
    const getInputByContent = (subject) => {
        const $labelElement = getByContent(subject);
        const $inputElement =
            $labelElement[0]?.querySelector('input, textarea') ??
            getDocument(subject).getElementById($labelElement[0]?.getAttribute('for'));

        if ($inputElement) {
            return Cypress.dom.wrap($inputElement);
        }

        return cy.$$(null);
    };

    return (subject) => query.execute(subject, getInputByContent, getInputByAriaLabel);
}

export function ariaLabel(label: string, options: QueryOptions = {}): Query {
    return queryAlias(this, ['get', `[aria-label="${label}"]`], options);
}
