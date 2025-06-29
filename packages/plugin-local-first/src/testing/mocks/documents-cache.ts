import type { DocumentsCache } from 'soukai-solid';

export function defineDocumentsCacheMock(parent: typeof DocumentsCache): typeof DocumentsCache {
    return class extends parent {

        private _metadata: Record<string, { modifiedAt: number }> = {};

        public override async remember(collection: string, id: string, modifiedAt: number | Date): Promise<void> {
            this._metadata[this.getDocumentKey(collection, id)] = {
                modifiedAt: typeof modifiedAt === 'number' ? modifiedAt : modifiedAt.getTime(),
            };
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
