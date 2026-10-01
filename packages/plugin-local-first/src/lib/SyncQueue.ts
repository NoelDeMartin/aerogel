import { App } from '@aerogel/core';
import { getContainedModels } from '@aerogel/plugin-local-first/lib/models';
import { debounce, facade, isInstanceOf, required } from '@noeldemartin/utils';
import { Container, type Model } from 'soukai-bis';

const Cloud = required(() => App.service('$cloud'));

class SyncQueue {
    private models: Set<Model> = new Set();
    private debouncedSync = debounce(() => this.sync(), 1000);

    public push(model: Model): void {
        this.models.add(model);
        this.debouncedSync();
    }

    public clear(models?: Model[]): void {
        if (!models) {
            this.models = new Set();
            this.debouncedSync.cancel();

            return;
        }

        for (const model of models) {
            this.models.delete(model);
        }

        if (this.models.size === 0) {
            this.debouncedSync.cancel();
        }
    }

    private async sync(): Promise<void> {
        const models = this.consume();

        if (models.length === 0) {
            return;
        }

        await Cloud.syncIfOnline(models);
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
