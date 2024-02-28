import Job from './Job';

export { Job };

export async function dispatch(job: Job): Promise<void> {
    await job.run();
}
