export interface JobStatus {
    completed: boolean;
    children?: JobStatus[];
}
