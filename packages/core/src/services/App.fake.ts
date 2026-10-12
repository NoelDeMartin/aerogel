import { facade } from '@noeldemartin/utils';

import { AppService } from './App';

export class FakeAppService extends AppService {}

export default facade(FakeAppService);
