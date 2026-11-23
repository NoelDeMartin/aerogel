import { InMemoryEngine, SolidEngine } from 'soukai-bis';

export default class FakeSolidEngine extends SolidEngine {
    private engine = new InMemoryEngine();

    public override createDocument(
        ...args: Parameters<SolidEngine['createDocument']>
    ): ReturnType<SolidEngine['createDocument']> {
        return this.engine.createDocument(...args);
    }

    public override createDocumentInContainer(
        ...args: Parameters<SolidEngine['createDocumentInContainer']>
    ): ReturnType<SolidEngine['createDocumentInContainer']> {
        return this.engine.createDocumentInContainer(...args);
    }

    public override updateDocument(
        ...args: Parameters<SolidEngine['updateDocument']>
    ): ReturnType<SolidEngine['updateDocument']> {
        return this.engine.updateDocument(...args);
    }

    public override readDocument(
        ...args: Parameters<SolidEngine['readDocument']>
    ): ReturnType<SolidEngine['readDocument']> {
        return this.engine.readDocument(...args);
    }

    public override deleteDocument(
        ...args: Parameters<SolidEngine['deleteDocument']>
    ): ReturnType<SolidEngine['deleteDocument']> {
        return this.engine.deleteDocument(...args);
    }

    public override async writeFile(
        url: Parameters<SolidEngine['writeFile']>[0],
        blob: Parameters<SolidEngine['writeFile']>[1],
        options: Parameters<SolidEngine['writeFile']>[2] = {},
    ): ReturnType<SolidEngine['writeFile']> {
        await this.engine.writeFile(url, blob, { mimeType: options.mimeType, lastModifiedAt: new Date() });

        return { headers: new Headers() };
    }

    public override async createFile(
        url: Parameters<SolidEngine['createFile']>[0],
        blob: Parameters<SolidEngine['createFile']>[1],
        options: Parameters<SolidEngine['createFile']>[2] = {},
    ): ReturnType<SolidEngine['createFile']> {
        await this.engine.createFile(url, blob, { mimeType: options.mimeType, lastModifiedAt: new Date() });

        return { headers: new Headers() };
    }

    public override readFile(...args: Parameters<SolidEngine['readFile']>): ReturnType<SolidEngine['readFile']> {
        return this.engine.readFile(...args);
    }

    public override async readFileMetadata(
        url: Parameters<SolidEngine['readFileMetadata']>[0],
    ): ReturnType<SolidEngine['readFileMetadata']> {
        const file = await this.engine.getLocalFile(url);

        if (!file || file.deleted || !file.hasLocalContents) {
            return null;
        }

        return {
            mimeType: file.mimeType,
            lastModifiedAt: file.lastModifiedAt ?? undefined,
        };
    }

    public override async deleteFile(
        url: Parameters<SolidEngine['deleteFile']>[0],
    ): ReturnType<SolidEngine['deleteFile']> {
        await this.engine.deleteFile(url);

        return { headers: new Headers() };
    }
}
