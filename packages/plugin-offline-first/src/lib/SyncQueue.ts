import { after, arrayRemove, facade, required } from '@noeldemartin/utils';
import { App } from '@aerogel/core';
import { type SolidModel, isContainer } from 'soukai-solid';

import { getContainedModels } from '@/lib/inference';

const Cloud = required(() => App.service('$cloud'));

class SyncQueue {

    private models: Set<SolidModel> = new Set();
    private promises: Promise<unknown>[] = [];

    public push(model: SolidModel): void {
        this.models.add(model);
        this.syncAfter(after({ seconds: 1 }));
    }

    public clear(models?: SolidModel[]): void {
        if (!models) {
            this.models = new Set();

            return;
        }

        for (const model of models) {
            this.models.delete(model);
        }
    }

    protected async syncAfter<T = void>(operationOrPromise: Promise<T> | (() => Promise<T>)): Promise<T> {
        const promise = typeof operationOrPromise === 'function' ? operationOrPromise() : operationOrPromise;

        this.promises.push(promise);

        promise.then(() => arrayRemove(this.promises, promise));

        if (this.promises.length === 1) {
            this.schedule();
        }

        return promise as Promise<T>;
    }

    private schedule(): void {
        Promise.all(this.promises)
            .then(() => after())
            .then(() => {
                if (this.promises.length !== 0) {
                    this.schedule();

                    return;
                }

                const models = this.consume();

                if (models.length === 0) {
                    return;
                }

                Cloud.syncIfOnline(models);
            });
    }

    private consume(): SolidModel[] {
        const models: SolidModel[] = [];
        const children: Set<SolidModel> = new Set();

        for (const model of this.models) {
            if (!isContainer(model)) {
                continue;
            }

            this.models.delete(model);
            getContainedModels(model).forEach((child) => children.add(child));
            models.push(model);
        }

        for (const model of this.models) {
            this.models.delete(model);

            if (children.has(model)) {
                continue;
            }

            models.push(model);
        }

        return models;
    }

}

export default facade(SyncQueue);
