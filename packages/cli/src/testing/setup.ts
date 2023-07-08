import { setTestingNamespace } from '@noeldemartin/utils';
import { vi } from 'vitest';

import File from '@/lib/filesystem/File';
import FileMock from '@/lib/filesystem/File.mock';

setTestingNamespace(vi);

File.setMockClass(FileMock);
