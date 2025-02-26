import Job from './Job';

export { Job };
export * from './Job';
export * from './listeners';
export * from './status';

export async function dispatch(job: Job): Promise<void> {
    await job.start();
}
