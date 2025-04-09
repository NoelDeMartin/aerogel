declare module 'virtual:aerogel' {
    export interface VirtualAerogel {
        name: string;
        version: string;
        basePath: string;
        sourceHash: string;
        sourceUrl?: string;
        locales: Record<string, string>;
    }

    const virtual: VirtualAerogel;

    export default virtual;
}

declare module 'virtual:aerogel-solid' {
    import type { ClientIDDocument } from '@aerogel/vite';

    export interface VirtualAerogelSolid {
        clientID?: ClientIDDocument;
    }

    const virtual: VirtualAerogelSolid;

    export default virtual;
}
