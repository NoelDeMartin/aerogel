import SolidTask from '@/models/SolidTask';

export default class LocalTask extends SolidTask {

    public static override cloud = { path: '/tasks/' };
    public static override history = true;
    public static override tombstone = false;

}
