import type { ClosureArgs } from '@noeldemartin/utils';

export type Query<T = Cypress.JQueryWithSelector<HTMLElement>> = (subject: Cypress.PrevSubject) => T;
export type QueryOptions = Partial<Cypress.Loggable & Cypress.Timeoutable>;

interface CustomQuery {
    subquery<T = Cypress.JQueryWithSelector<HTMLElement>>(...args: [string, ...ClosureArgs]): Query<T>;
    execute(subject: Cypress.PrevSubject, ...subqueries: Query[]): Cypress.JQueryWithSelector;
}

function firstQueryMatch(subject: Cypress.PrevSubject, ...queries: Query[]): Cypress.JQueryWithSelector | null {
    for (const query of queries) {
        const $el = query(subject);

        if ($el.length !== 0) {
            return $el;
        }
    }

    return null;
}

// TODO this should be typed as HTMLElement, but it's throwing a compilation error when generating
// the types with rpt2.
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function getAriaDescription(element: any): string | null {
    if (element.ariaDescription) {
        return element.ariaDescription;
    }

    const describedBy = element.getAttribute('aria-describedby');

    if (!describedBy) {
        return null;
    }

    return element.ownerDocument.getElementById(describedBy)?.innerText.trim() ?? null;
}

export function prepareQuery(command: Cypress.Command, options: QueryOptions = {}): CustomQuery {
    const log = options.log !== false && Cypress.log({ timeout: options.timeout });
    const logElement: ($element: Cypress.JQueryWithSelector | null) => void = ($element) => {
        if (!log || cy.state('current') === command) {
            return;
        }

        log.set({
            $el: $element ?? undefined,
            consoleProps: () => {
                return {
                    Yielded: $element?.[0] ?? '--nothing--',
                    Elements: $element?.length ?? 0,
                };
            },
        });
    };

    options.timeout && command.set('timeout', options.timeout);

    return {
        execute: (subject, ...subqueries) => {
            const $element = firstQueryMatch(subject, ...subqueries);

            logElement($element);

            return $element ?? cy.$$(null as unknown as string);
        },
        subquery: <T>(...args: [string, ...ClosureArgs]) =>
            cy.now(...args, { log: false, timeout: options.timeout }) as Query<T>,
    };
}

export function queryAlias(
    command: Cypress.Command,
    args: [string, ...ClosureArgs],
    options: QueryOptions = {},
): Query {
    const query = prepareQuery(command, options);
    const getByContent = query.subquery(...args);

    return (subject) => query.execute(subject, getByContent);
}
