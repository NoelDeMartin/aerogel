import { arrayFrom, facade } from '@noeldemartin/utils';

export class LogService {

    public info(messages: string | string[]): void {
        // eslint-disable-next-line no-console
        arrayFrom(messages).forEach((message) => console.log(message));
    }

}

export default facade(new LogService());
