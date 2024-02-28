export default abstract class Job {

    public abstract run(): Promise<void>;

}
