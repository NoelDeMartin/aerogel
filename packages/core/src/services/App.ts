import { facade } from '@noeldemartin/utils';

import Events from '@/services/Events';

import Service from './App.state';

export class AppService extends Service {

    protected async boot(): Promise<void> {
        Events.once('application-mounted', () => this.setState({ isMounted: true }));
    }

}

export default facade(new AppService());
