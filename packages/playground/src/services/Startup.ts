import { Service } from '@aerogel/core';
import { facade, hasLocationQueryParameter } from '@noeldemartin/utils';

export class StartupService extends Service {

    protected async boot(): Promise<void> {
        if (hasLocationQueryParameter('startupCrash')) {
            throw new Error(
                'This is an error caused during application startup, ' +
                    'you can fix it by removing `startupCrash=true` from the url',
            );
        }
    }

}

export default facade(new StartupService());
