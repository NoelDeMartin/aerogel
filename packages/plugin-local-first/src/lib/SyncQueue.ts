import { after, arrayRemove, facade, isInstanceOf, required } from '@noeldemartin/utils';
import { App } from '@aerogel/core';
import { Container, type Model } from 'soukai-bis';

import { getContainedModels } from '@aerogel/plugin-local-first/lib/models';

const Cloud = required(() => App.service('$cloud'));

class SyncQueue {

    private models: Set<Model> = new Set();
    private promises: Promise<unknown>[] = [];

    public push(model: Model): void {
        this.models.add(model);
        this.syncAfter(after({ seconds: 1 }));
    }

    public clear(models?: Model[]): void {
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

    private consume(): Model[] {
        const models: Model[] = [];
        const children: Set<Model> = new Set();

        for (const model of this.models) {
            if (!isInstanceOf(model, Container)) {
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
