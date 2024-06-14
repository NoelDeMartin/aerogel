import { Errors, Events, dispatch, translateWithDefault } from '@aerogel/core';
import { Semaphore, after, facade, fail, map, mixed } from '@noeldemartin/utils';
import { Solid } from '@aerogel/plugin-solid';
import { Tombstone, isContainerClass } from 'soukai-solid';
import { trackModelCollection } from '@aerogel/plugin-soukai';
import { watchEffect } from 'vue';
import type { Authenticator } from '@aerogel/plugin-solid';
import type { Engine } from 'soukai';
import type { SolidModel, SolidModelConstructor } from 'soukai-solid';

import MigrateLocalDocuments from '@/jobs/MigrateLocalDocuments';

import CloudInference from './cloud-mixins/inference';
import CloudMirroring from './cloud-mixins/mirroring';
import CloudSynchronization from './cloud-mixins/synchronization';
import Service, { CloudStatus } from './Cloud.state';

export class CloudService extends mixed(Service, [CloudSynchronization, CloudMirroring, CloudInference]) {

    protected asyncLock: Semaphore = new Semaphore();
    protected engine: Engine | null = null;
    protected pollingInterval: NodeJS.Timeout | null = null;

    public async whenReady<T>(callback: () => T): Promise<T> {
        if (this.ready) {
            return callback();
        }

        return new Promise((resolve) => {
            const onReady = () => resolve(callback());

            Events.once('cloud:ready', onReady);
        });
    }

    public async setup(): Promise<void> {
        await this.migrateLocalDocuments();
        await Events.emit('cloud:migrated');
        await this.setReady(true);
        await this.sync();
    }

    public dismissSetup(): void {
        this.setupDismissed = true;
    }

    public async syncIfOnline(model?: SolidModel): Promise<void> {
        if (!this.online) {
            return;
        }

        await this.sync(model);
    }

    public async sync(model?: SolidModel): Promise<void> {
        if (!Solid.isLoggedIn() || !this.ready) {
            return;
        }

        await this.asyncLock.run(async () => {
            const start = Date.now();

            this.status = CloudStatus.Syncing;

            await Events.emit('cloud:sync-started');

            try {
                await this.pullChanges(model);
                await this.pushChanges(model);
                await after({ milliseconds: Math.max(0, 1000 - (Date.now() - start)) });
            } catch (error) {
                await Errors.report(error, translateWithDefault('cloud.syncFailed', 'Sync failed'));
            } finally {
                this.status = CloudStatus.Online;

                await Events.emit('cloud:sync-completed');
            }
        });
    }

    public async register(modelClass: SolidModelConstructor): Promise<void> {
        const engine = this.engine;

        if (engine) {
            this.getRelatedClasses(modelClass).forEach((relatedClass) =>
                this.getRemoteClass(relatedClass).setEngine(engine));
        }

        this.whenReady(() => {
            if (!isContainerClass(modelClass)) {
                return;
            }

            modelClass.collection = this.getRemoteContainersCollection();
        });

        await trackModelCollection(modelClass, {
            created: (model) => this.createRemoteModel(model),
            updated: (model) => this.updateRemoteModel(model),
        });

        this.registeredModels.add(modelClass);
    }

    protected async boot(): Promise<void> {
        await Solid.booted;

        Solid.isLoggedIn() && this.login(Solid.authenticator);

        Events.on('auth:login', ({ authenticator }) => this.login(authenticator));
        Events.on('auth:logout', () => this.logout());
        Events.once('application-ready', () => this.autoSetup());
        Events.once('application-mounted', () => this.startupSync && this.sync());

        watchEffect(() => {
            this.pollingInterval && clearInterval(this.pollingInterval);

            if (!this.pollingEnabled) {
                this.pollingInterval = null;

                return;
            }

            this.pollingInterval = setInterval(() => this.sync(), this.pollingMinutes * 60 * 1000);
        });
    }

    protected requireEngine(): Engine {
        return this.engine ?? fail('Could not get required Engine');
    }

    protected async setReady(ready: boolean): Promise<void> {
        if (this.ready || !ready) {
            return;
        }

        await Events.emit('cloud:ready');

        this.ready = true;
    }

    protected async migrateLocalDocuments(): Promise<void> {
        const job = new MigrateLocalDocuments();

        for (const modelClass of this.registeredModels) {
            if (!isContainerClass(modelClass)) {
                continue;
            }

            const localCollection = modelClass.collection;
            const remoteCollection = this.getRemoteContainersCollection();

            modelClass.collection = remoteCollection;

            job.migrateCollection(localCollection, remoteCollection);
        }

        await dispatch(job);
    }

    protected async autoSetup(): Promise<void> {
        if (this.ready || !Solid.isLoggedIn()) {
            return;
        }

        await this.setReady(!this.getLocalModels().some((model) => model.url.startsWith('solid://')));
    }

    protected login(authenticator: Authenticator): void {
        const relatedClasses = [...this.registeredModels]
            .map((modelClass) => this.getRelatedClasses(modelClass))
            .flat()
            .concat([Tombstone]);

        this.status = CloudStatus.Online;
        this.engine = authenticator.engine;

        for (const relatedClass of relatedClasses) {
            this.getRemoteClass(relatedClass).setEngine(this.engine);
        }
    }

    protected logout(): void {
        this.setState({
            status: CloudStatus.Disconnected,
            dirtyRemoteModels: map([], 'url'),
            localModelUpdates: {},
            remoteOperationUrls: {},
        });
    }

}

export default facade(CloudService);

declare module '@aerogel/core' {
    export interface EventsPayload {
        'cloud:migrated': void;
        'cloud:ready': void;
        'cloud:sync-completed': void;
        'cloud:sync-started': void;
    }
}
