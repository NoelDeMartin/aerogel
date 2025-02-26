export interface JobListener {
    onUpdated(progress: number): unknown;
}
