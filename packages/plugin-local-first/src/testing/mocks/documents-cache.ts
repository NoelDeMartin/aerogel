import type { EngineDocument } from 'soukai';
import type { DocumentsCache } from 'soukai-solid';

export function defineDocumentsCacheMock(parent: typeof DocumentsCache): typeof DocumentsCache {
    return class extends parent {

        private _metadata: Record<string, { modifiedAt: number; tombstone?: { url: string; resourceUrl: string } }> =
            {};

        public override async remember(
            collection: string,
            id: string,
            modifiedAt: number | Date,
            options?: { tombstone?: { url: string; resourceUrl: string } },
        ): Promise<void> {
            this._metadata[this.getDocumentKey(collection, id)] = {
                modifiedAt: typeof modifiedAt === 'number' ? modifiedAt : modifiedAt.getTime(),
                tombstone: options?.tombstone,
            };
        }

        public override async get(collection: string, id: string): Promise<EngineDocument | null> {
            const metadata = this._metadata[this.getDocumentKey(collection, id)];

            if (metadata?.tombstone) {
                const date = new Date(metadata.modifiedAt);

                return {
                    '@graph': [
                        {
                            '@id': metadata.tombstone.url,
                            '@type': 'https://vocab.noeldemartin.com/crdt/Tombstone',
                            'https://vocab.noeldemartin.com/crdt/deletedAt': {
                                '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
                                '@value': date.toISOString(),
                            },
                            'https://vocab.noeldemartin.com/crdt/resource': {
                                '@id': metadata.tombstone.resourceUrl,
                            },
                        },
                    ],
                };
            }

            return this.engine.readOne(collection, id);
        }

        public override async forget(collection: string, id: string): Promise<void> {
            delete this._metadata[this.getDocumentKey(collection, id)];
        }

        public override async activate(collection: string, id: string, modifiedAt: number): Promise<void> {
            const meta = this._metadata[this.getDocumentKey(collection, id)];

            this.active[this.getDocumentKey(collection, id)] = !!meta?.modifiedAt && meta.modifiedAt >= modifiedAt;
        }
    
    };
}
