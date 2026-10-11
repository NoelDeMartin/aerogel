import { facade } from '@noeldemartin/utils';

import { AppService } from './App';

/**
 * App service used in testing environments such as Storybook, where state is set up from scratch.
 */
export class FakeAppService extends AppService {}

export default facade(FakeAppService);
