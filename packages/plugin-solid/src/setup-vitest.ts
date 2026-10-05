import 'soukai-bis/patch-zod';
import { bootModels } from '@aerogel/plugin-solid/utils/soukai';
import appModels from 'virtual:aerogel-models';
import { beforeAll } from 'vite-plus/test';

beforeAll(() => bootModels(appModels));
