declare module 'virtual:aerogel' {
    export interface VirtualAerogel {
        environment: 'production' | 'development' | 'testing' | string;
        basePath?: string;
        sourceUrl?: string;
    }

    const virtual: VirtualAerogel;

    export default virtual;
}

declare module 'virtual:aerogel-solid' {
    export interface VirtualAerogelSolid {
        clientID?: ClientIDDocument;
    }

    export interface ClientIDDocument {
        '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld';
        client_id: string;
        client_name: string;
        redirect_uris: string[];
        client_uri: string;
        logo_uri?: string;
        scope: string;
        grant_types: string[];
        response_types: string[];
    }

    const virtual: VirtualAerogelSolid;

    export default virtual;
}
