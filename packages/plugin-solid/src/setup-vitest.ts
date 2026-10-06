import 'soukai-bis/patch-zod';
import { bootModels } from '@aerogel/plugin-solid/utils/soukai';
import { beforeAll } from 'vite-plus/test';

beforeAll(async () => {
    const { default: appModels } = await import('virtual:aerogel-models');

    bootModels(appModels);
});
