import type { CloudRegistration } from '@aerogel/plugin-local-first/services/Cloud';
import Post from '@aerogel/plugin-local-first/testing/stubs/models/Post';
import { describe, expect, it } from 'vite-plus/test';

import { getCloudRegistration } from './cloud';

describe('Cloud utils', () => {
    it('does not inherit cloud registrations', () => {
        class RegisteredPost extends Post {
            public static override cloud: CloudRegistration = { depth: 1 };
        }

        class NestedPost extends RegisteredPost {}

        class UnregisteredPost extends RegisteredPost {
            public static override cloud = false;
        }

        expect(getCloudRegistration(Post)).toBeUndefined();
        expect(getCloudRegistration(RegisteredPost)).toEqual({ depth: 1 });
        expect(getCloudRegistration(NestedPost)).toBeUndefined();
        expect(getCloudRegistration(UnregisteredPost)).toBe(false);
    });
});
