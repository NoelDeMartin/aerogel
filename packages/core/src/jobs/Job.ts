import { ListenersManager, round } from '@noeldemartin/utils';
import type { Listeners } from '@noeldemartin/utils';

import type { JobListener } from './listeners';
import type { JobStatus } from './status';

export default abstract class Job<Listener extends JobListener = JobListener, Status extends JobStatus = JobStatus> {

    protected _listeners: ListenersManager<JobListener>;
    protected status: Status;
    protected progress: number | null;

    constructor() {
        this._listeners = new ListenersManager();
        this.status = this.getInitialStatus();
        this.progress = null;
    }

    public async start(): Promise<void> {
        await this.updateProgress();
        await this.run();
        await this.updateProgress();
    }

    public get listeners(): Listeners<Listener> {
        return this._listeners;
    }

    protected abstract run(): Promise<void>;

    protected getInitialStatus(): Status {
        return { completed: false } as Status;
    }

    protected calculateCurrentProgress(status?: JobStatus): number {
        status ??= this.status;

        if (status.completed) {
            return 1;
        }

        if (!status.children) {
            return 0;
        }

        return round(
            status.children.reduce((total, child) => total + this.calculateCurrentProgress(child), 0) /
                status.children.length,
            2,
        );
    }

    protected async updateProgress(update?: (status: Status) => unknown): Promise<void> {
        await update?.(this.status);

        const progress = this.calculateCurrentProgress();

        if (progress === this.progress) {
            return;
        }

        this.progress = progress;

        await this._listeners.emit('onUpdated', progress);
    }

}
