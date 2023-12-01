import type { Connect } from 'vite';
import type { PluginContext } from 'rollup';

import type { AppInfo, Options } from '@/lib/options';

import type { ClientIDDocument } from 'virtual:aerogel-solid-clientid';

function createClientIDDocument(app: AppInfo, options: Options): ClientIDDocument {
    if (!app.baseUrl) {
        throw new Error('Can\'t create solid clientID without a baseUrl!');
    }

    const baseUrl = app.baseUrl.endsWith('/') ? app.baseUrl : `${app.baseUrl}/`;
    const logoPublicPath = options.icons && (options.icons['512x512'] ?? Object.values(options.icons).pop());
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

export function generateSolidAssets(context: PluginContext, app: AppInfo, options: Options): void {
    if (!app.plugins?.includes('solid')) {
        return;
    }

    context.emitFile({
        type: 'asset',
        fileName: 'clientid.jsonld',
        source: JSON.stringify(createClientIDDocument(app, options)),
    });
}

export function generateSolidVirtualClientIDModule(app: AppInfo, options: Options): string {
    return `export default ${JSON.stringify(createClientIDDocument(app, options))};`;
}

export function solidMiddleware(app: AppInfo, options: Options): Connect.NextHandleFunction {
    return (request, response, next) => {
        if (!request.url?.endsWith('/clientid.jsonld')) {
            next();

            return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/ld+json');
        response.write(JSON.stringify(createClientIDDocument(app, options)), 'utf-8');
        response.end();
    };
}
