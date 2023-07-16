import { facade } from '@noeldemartin/utils';

import Service from './App.state';

export class AppService extends Service {}

export default facade(new AppService());
