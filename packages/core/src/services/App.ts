import { facade } from '@noeldemartin/utils';

import Service from './App.state';

export class AppService extends Service {

    public get isDevelopment(): boolean {
        return this.environment === 'development';
    }

}

export default facade(new AppService());
