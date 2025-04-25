#!/usr/bin/env bash

sed -i "1i import '@simonsmith/cypress-image-snapshot/types'" "dist/aerogel-cypress.d.ts"
sed -i 's/^import { Query } from.*$/export type Query<T = Cypress.JQueryWithSelector<HTMLElement>> = (subject: Cypress.PrevSubject) => T;/g' "dist/aerogel-cypress.d.ts"
sed -i 's/^import { QueryOptions } from.*$/export type QueryOptions = Partial<Cypress.Loggable \& Cypress.Timeoutable>;/g' "dist/aerogel-cypress.d.ts"
