import { buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';
import { requireEngine, setEngine } from 'soukai';
import { SolidContainer, SolidEngine, bootSolidModels } from 'soukai-solid';

const DEFAULT_POD_DOCUMENTS = [
    cssPodUrl('/alice/README'),
    cssPodUrl('/alice/profile/card'),
    cssPodUrl('/alice/profile/'),
    cssPodUrl('/alice/'),
];

function cyCreateAccount(): void {
    cy.request({
        method: 'POST',
        url: cssPodUrl('/idp/register/'),
        failOnStatusCode: false,
        headers: {
            Accept: 'application/json',
        },
        body: {
            email: 'alice@example.com',
            password: 'secret',
            confirmPassword: 'secret',
            createWebId: true,
            register: true,
            createPod: true,
            podName: 'alice',
            rootPod: false,
        },
    }).then((response) => {
        if (!isAccountCreatedResponse(response.body) || !isErrorResponse(response.body, 'Account already exists')) {
            return;
        }

        throw new Error(`Failed creating account in Solid Server: ${response.body.message}`);
    });
}

function log(...messages: [string, ...unknown[]]): void {
    const [firstMessage, ...otherMessages] = messages;

    // eslint-disable-next-line no-console
    console.log(`[CommunitySolidServer]: ${firstMessage}`, ...otherMessages);
}

async function authenticate(): Promise<typeof fetch | undefined> {
    const credentials = await getCredentials();

    if (!credentials) {
        return;
    }

    const authString = `${encodeURIComponent(credentials.id)}:${encodeURIComponent(credentials.secret)}`;
    const tokenUrl = cssPodUrl('/.oidc/token');
    const dpopKey = await generateDpopKeyPair();
    const dpop = await createDpopHeader(tokenUrl, 'POST', dpopKey);
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(authString).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'DPoP': dpop,
        },
        body: 'grant_type=client_credentials&scope=webid',
    });
    const json = await response.json();

    if (!isAccessTokenResponse(json)) {
        throw new Error(`Failed getting access token to reset POD in Solid Server: ${json.message}`);
    }

    return buildAuthenticatedFetch(fetch, json.access_token, { dpopKey });
}

async function getCredentials(): Promise<{ id: string; secret: string } | undefined> {
    const response = await fetch(cssPodUrl('/idp/credentials/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'alice@example.com',
            password: 'secret',
            name: 'cypress',
        }),
    });
    const json = await response.json();

    if (isErrorResponse(json, 'Account does not exist')) {
        log('Account does not exist, no need to reset POD.');

        return;
    }

    if (!isTokenResponse(json)) {
        throw new Error(`Failed getting credentials to reset POD in Solid Server: ${json.message}`);
    }

    return {
        id: json.id,
        secret: json.secret,
    };
}

async function deletePodDocuments(authenticatedFetch: typeof fetch): Promise<void> {
    bootSolidModels();
    setEngine(new SolidEngine(authenticatedFetch));

    const root = await SolidContainer.findOrFail(cssPodUrl('/alice/'));

    await deleteContainer(root);
}

async function deleteContainer(container: SolidContainer): Promise<void> {
    await Promise.all(
        (container.resourceUrls as string[]).map(async (url) => {
            if (url.endsWith('/')) {
                const childContainer = await SolidContainer.findOrFail(url);

                await deleteContainer(childContainer);

                return;
            }

            await deleteDocument(url);
        }),
    );

    await deleteDocument(container.url);
}

async function deleteDocument(url: string): Promise<void> {
    if (DEFAULT_POD_DOCUMENTS.includes(url)) {
        return;
    }

    log(`Delete '${url}'`);

    const authenticatedFetch = requireEngine<SolidEngine>().getFetch();

    await authenticatedFetch(url, { method: 'DELETE' });
}

function isErrorResponse(response: unknown, message: string): boolean {
    return (
        typeof response === 'object' &&
        response !== null &&
        'statusCode' in response &&
        'message' in response &&
        response.statusCode === 500 &&
        response.message === message
    );
}

function isAccountCreatedResponse(response: unknown): boolean {
    return (
        typeof response === 'object' &&
        response !== null &&
        'webId' in response &&
        'register' in response &&
        response.webId === cssPodUrl('/alice/profile/card#me') &&
        response.register === true
    );
}

function isAccessTokenResponse(response: unknown): response is { access_token: string } {
    return (
        typeof response === 'object' &&
        response !== null &&
        'access_token' in response &&
        typeof response.access_token === 'string'
    );
}

function isTokenResponse(response: unknown): response is { id: string; secret: string } {
    return (
        typeof response === 'object' &&
        response !== null &&
        'id' in response &&
        'secret' in response &&
        typeof response.id === 'string' &&
        typeof response.secret === 'string'
    );
}

export function cssPodUrl(path: string = ''): string {
    return `http://localhost:4000${path}`;
}

export async function cssResetPOD(): Promise<void> {
    log('Resetting POD.');

    const authenticatedFetch = await authenticate();

    if (!authenticatedFetch) {
        return;
    }

    await deletePodDocuments(authenticatedFetch);

    log('POD reset complete.');
}

export function cyCssLogin(): void {
    cyCreateAccount();

    cy.get('#email').type('alice@example.com');
    cy.get('#password').type('secret');
    cy.contains('button', 'Log in').click();
    cy.contains('button', 'Authorize').click();
}
