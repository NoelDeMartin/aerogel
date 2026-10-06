import type { ModelsWorkerMethods } from '@aerogel/plugin-solid/models-worker';
import { PromisedValue, toError } from '@noeldemartin/utils';
import type { Model, ModelConstructor } from 'soukai-bis';

type MethodName = keyof ModelsWorkerMethods;
type MethodArgs<T extends MethodName> = Parameters<ModelsWorkerMethods[T]>;
type MethodChunk<T extends MethodName> =
    ReturnType<ModelsWorkerMethods[T]> extends AsyncIterable<infer TChunk> ? TChunk : never;

export interface ModelsWorkerRequest<T extends MethodName = MethodName> {
    id: number;
    method: T;
    args: MethodArgs<T>;
}

export type ModelsWorkerResponse =
    | { id: number; type: 'chunk'; value: unknown }
    | { id: number; type: 'done'; value?: unknown }
    | { id: number; type: 'error'; message: string };

type StreamItem<T> = { done: true } | { done: false; chunk: T; next: PromisedValue<StreamItem<T>> };

interface PendingRequest {
    onChunk(chunk: unknown): unknown;
    resolve(value: unknown): void;
    reject(error: Error): void;
}

export default class ModelsWorker {
    private worker: Promise<Worker> | null = null;
    private lastRequestId = 0;
    private pendingRequests = new Map<number, PendingRequest>();
    private _terminated = false;

    constructor(private namespace: string) {}

    public get terminated(): boolean {
        return this._terminated;
    }

    public async *loadModels<T extends Model>(
        modelClass: ModelConstructor<T>,
        options: { depth?: number } = {},
    ): AsyncGenerator<T[]> {
        for await (const serializedModels of this.stream(
            'loadModels',
            modelClass.modelName,
            modelClass.defaultContainerUrl,
            options.depth,
        )) {
            yield await Promise.all(serializedModels.map((serializedModel) => modelClass.hydrate(serializedModel)));
        }
    }

    public terminate(): void {
        const worker = this.worker;

        this._terminated = true;
        this.worker = null;
        this.rejectPendingRequests(new Error('Models worker was terminated'));

        worker?.then(
            (webWorker) => webWorker.terminate(),
            () => null,
        );
    }

    private async *stream<T extends MethodName>(method: T, ...args: MethodArgs<T>): AsyncGenerator<MethodChunk<T>> {
        const worker = await this.getWorker();
        const firstItem = new PromisedValue<StreamItem<MethodChunk<T>>>();
        let lastItem = firstItem;

        const { id, response } = this.send(worker, method, args, (chunk) => {
            const nextItem = new PromisedValue<StreamItem<MethodChunk<T>>>();

            lastItem.resolve({ done: false, chunk: chunk as MethodChunk<T>, next: nextItem });
            lastItem = nextItem;
        });

        response.then(
            () => lastItem.resolve({ done: true }),
            (error) => lastItem.reject(toError(error)),
        );

        try {
            for (let item = await firstItem; !item.done; item = await item.next) {
                yield item.chunk;
            }
        } finally {
            this.pendingRequests.delete(id);
        }
    }

    private send<T extends MethodName>(
        worker: Worker,
        method: T,
        args: MethodArgs<T>,
        onChunk: (chunk: unknown) => unknown = () => null,
    ): { id: number; response: Promise<unknown> } {
        const id = ++this.lastRequestId;
        const request: ModelsWorkerRequest<T> = { id, method, args };
        const response = new Promise((resolve, reject) => this.pendingRequests.set(id, { onChunk, resolve, reject }));

        worker.postMessage(request);

        return { id, response };
    }

    private getWorker(): Promise<Worker> {
        return (this.worker ??= this.createWorker());
    }

    private async createWorker(): Promise<Worker> {
        const { default: WebWorker } = await import('virtual:aerogel-models-worker');
        const worker = new WebWorker();

        worker.addEventListener('message', ({ data }: MessageEvent<ModelsWorkerResponse>) => this.onResponse(data));
        worker.addEventListener('error', (event) =>
            this.crash(worker, new Error(`Models worker failed: ${event.message}`)),
        );

        try {
            await this.send(worker, 'boot', [this.namespace]).response;
        } catch (error) {
            this.crash(worker, toError(error));

            throw error;
        }

        return worker;
    }

    private onResponse(response: ModelsWorkerResponse): void {
        const request = this.pendingRequests.get(response.id);

        if (!request) {
            return;
        }

        switch (response.type) {
            case 'chunk':
                request.onChunk(response.value);
                break;
            case 'done':
                this.pendingRequests.delete(response.id);
                request.resolve(response.value);
                break;
            case 'error':
                this.pendingRequests.delete(response.id);
                request.reject(new Error(response.message));
                break;
        }
    }

    private crash(worker: Worker, error: Error): void {
        worker.terminate();

        this.worker = null;
        this.rejectPendingRequests(error);
    }

    private rejectPendingRequests(error: Error): void {
        this.pendingRequests.forEach((request) => request.reject(error));
        this.pendingRequests.clear();
    }
}
