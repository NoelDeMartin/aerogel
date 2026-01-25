declare module 'virtual:aerogel' {
    export interface VirtualAerogel {
        name: string;
        namespace?: string;
        version: string;
        basePath: string;
        sourceHash: string;
        sourceUrl?: string;
        locales: Record<string, string>;
        soukaiBis: boolean;
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
