import { md5 } from '@noeldemartin/utils';
import type { Connect } from 'vite';
import type { PluginContext } from 'rollup';

import type { AppInfo, Options } from '@aerogel/vite/lib/options';

import type { VirtualAerogelSolid } from 'virtual:aerogel-solid';

function createClientIDDocument(app: AppInfo, options: Options): ClientIDDocument | null {
    if (!app.baseUrl) {
        // eslint-disable-next-line no-console
        console.warn(
            'It was not possible to create a Solid ClientID document because the baseUrl ' +
                'was not provided, to remove this warning add a `baseUrl` option in the Aerogel vite plugin options.',
        );

        return null;
    }

    const baseUrl = app.baseUrl.endsWith('/') ? app.baseUrl : `${app.baseUrl}/`;
    const logoPublicPath =
        options.icons &&
        (Array.isArray(options.icons)
            ? options.icons[0]?.src
            : (options.icons['512x512'] ?? Object.values(options.icons).pop()));
    const clientID: ClientIDDocument = {
        '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld',
        'client_id': `${baseUrl}clientid.jsonld`,
        'client_name': app.name,
        'redirect_uris': [baseUrl],
        'client_uri': baseUrl,
        'scope': 'openid profile offline_access webid',
        'grant_types': ['refresh_token', 'authorization_code'],
        'response_types': ['code'],
    };

    if (logoPublicPath) {
        clientID.logo_uri = baseUrl + logoPublicPath;
    }

    return clientID;
}

export interface ClientIDDocument {
    '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld';
    client_id: string;
    client_name: string;
    redirect_uris: [string, ...string[]];
    client_uri: string;
    logo_uri?: string;
    scope: string;
    grant_types: string[];
    response_types: string[];
}

export function generateSolidAssets(context: PluginContext, app: AppInfo, options: Options): void {
    if (!app.plugins?.includes('solid')) {
        return;
    }

    const clientID = createClientIDDocument(app, options);

    if (!clientID) {
        return;
    }

    const clientIdJSON = JSON.stringify(clientID);

    context.emitFile({
        type: 'asset',
        fileName: 'clientid.jsonld',
        source: clientIdJSON,
    });

    app.additionalManifestEntries.push({
        url: 'clientid.jsonld',
        revision: md5(clientIdJSON),
    });
}

export function generateSolidVirtualModule(app: AppInfo, options: Options): string {
    const clientId = options.solidClientId ?? true;
    const clientIdDocument = typeof clientId !== 'boolean' ? clientId : createClientIDDocument(app, options);
    const virtual: VirtualAerogelSolid = {};

    if (clientId && clientIdDocument) {
        virtual.clientID = clientIdDocument;
    }

    return `export default ${JSON.stringify(virtual)};`;
}

export function solidMiddleware(app: AppInfo, options: Options): Connect.NextHandleFunction {
    return (request, response, next) => {
        if (!request.url?.endsWith('/clientid.jsonld')) {
            next();

            return;
        }

        const clientID = createClientIDDocument(app, options);

        if (!clientID) {
            next();

            return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/ld+json');
        response.write(JSON.stringify(clientID), 'utf-8');
        response.end();
    };
}
