import { FakeLocalStorage } from '@noeldemartin/testing';
import { beforeEach } from 'vite-plus/test';

FakeLocalStorage.patchGlobal();

beforeEach(() => FakeLocalStorage.reset());
