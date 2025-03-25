export default interface ITask {
    id: string;
    name: string;

    delete(): Promise<unknown>;
}
