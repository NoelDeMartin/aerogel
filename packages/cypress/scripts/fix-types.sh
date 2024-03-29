#!/usr/bin/env bash

sed -i "1i\\/// <reference types=\"@simonsmith/cypress-image-snapshot/command\" />" dist/aerogel-cypress.d.ts
sed -i "s/see(text: string,/see<E extends Node = HTMLElement>(text: string,/" dist/aerogel-cypress.d.ts
sed -i "s/}> | undefined): void;/}> | undefined): Cypress.Chainable<JQuery<E>>;/" dist/aerogel-cypress.d.ts
sed -i "s/model<T extends never>/model<T extends keyof ModelsRegistry>/" dist/aerogel-cypress.d.ts
sed -i "s/dontSee(text: string)/dontSee(text: string, options?: Cypress.Timeoutable)/" dist/aerogel-cypress.d.ts
