import type Authenticator from '@aerogel/plugin-solid/auth/Authenticator';
import { SolidDocumentPermissions, fetchLoginUserProfile } from '@noeldemartin/solid-utils';
import type { SolidUserProfile, ShallowSolidUserProfile, CompleteSolidUserProfile } from '@noeldemartin/solid-utils';
import { Container, SolidEngine, TypeIndex } from 'soukai-bis';
import type { ModelWithUrl } from 'soukai-bis';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vite-plus/test';

import { SolidService } from './Solid';

vi.mock('@noeldemartin/solid-utils', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    fetchLoginUserProfile: vi.fn(),
}));

const webId = 'https://alice.example/profile/card#me';

const fullProfile: CompleteSolidUserProfile = {
    webId,
    shallow: false,
    cloakedDocumentUrls: [],
    storageUrls: ['https://alice.example/'],
    writableProfileUrl: 'https://alice.example/profile/card',
    name: 'Alice',
    publicTypeIndexUrls: [],
    privateTypeIndexUrls: ['https://alice.example/settings/privateTypeIndex'],
};

const shallowProfile: ShallowSolidUserProfile = {
    webId,
    shallow: true,
    cloakedDocumentUrls: [],
    storageUrls: [],
    publicTypeIndexUrls: [],
    privateTypeIndexUrls: [],
    writableProfileUrl: null,
    oidcIssuerUrl: 'https://idp.example',
};

describe('Solid', () => {
    let solid: SolidService;

    beforeEach(() => {
        solid = new SolidService();
        solid.setState({ profiles: {}, staleProfiles: [], previousSession: null, session: null });

        vi.mocked(fetchLoginUserProfile).mockReset();
    });

    it('refetches cached shallow profiles for full reads', async () => {
        // Arrange
        vi.mocked(fetchLoginUserProfile).mockResolvedValue(fullProfile);

        solid.setState({ profiles: { [webId]: shallowProfile } });

        // Act
        const cachedProfile = await solid.getUserProfile(webId, { shallow: true });
        const profile = await solid.getUserProfile(webId);

        // Assert
        expect(cachedProfile).toEqual(shallowProfile);
        expect(profile).toEqual(fullProfile);
        expect(fetchLoginUserProfile).toHaveBeenCalledTimes(1);
        expect(fetchLoginUserProfile).toHaveBeenCalledWith(webId, expect.objectContaining({ shallow: false }));
        expect(solid.profiles[webId]).toEqual(fullProfile);
    });

    it('uses cached full profiles for shallow reads', async () => {
        // Arrange
        solid.setState({ profiles: { [webId]: fullProfile } });

        // Act
        const profile = await solid.getUserProfile(webId, { shallow: true });

        // Assert
        expect(profile).toEqual(fullProfile);
        expect(fetchLoginUserProfile).not.toHaveBeenCalled();
    });

    it('reads profiles with the given fetch', async () => {
        // Arrange
        const authenticatedFetch = vi.fn();

        vi.mocked(fetchLoginUserProfile).mockResolvedValue(fullProfile);

        // Act
        const profile = await solid.requireUserProfile(webId, { fetch: authenticatedFetch });

        // Assert
        expect(profile).toEqual(fullProfile);
        expect(fetchLoginUserProfile).toHaveBeenCalledWith(webId, expect.objectContaining({ fetch: authenticatedFetch })); // prettier-ignore
        expect(solid.staleProfiles).toEqual([]);
    });

    it('marks profiles read without authentication as stale', async () => {
        // Arrange
        vi.mocked(fetchLoginUserProfile).mockResolvedValue(fullProfile);

        // Act
        await solid.requireUserProfile(webId);

        // Assert
        expect(solid.staleProfiles).toEqual([webId]);
    });

    it('does not return shallow profiles as the required user', () => {
        // Arrange
        solid.setState({
            previousSession: { profile: shallowProfile, loginUrl: webId, authenticator: 'inrupt', error: null },
        });

        // Act & Assert
        expect(solid.user).toEqual(shallowProfile);
        expect(() => solid.requireUser()).toThrow('Could not get user profile');
    });

    it('infers required profile types', () => {
        expectTypeOf(() => solid.requireUserProfile(webId)).returns.resolves.toEqualTypeOf<CompleteSolidUserProfile>();
        expectTypeOf(() => solid.requireUserProfile(webId, { shallow: false })).returns.resolves.toEqualTypeOf<CompleteSolidUserProfile>(); // prettier-ignore
        expectTypeOf(() => solid.requireUserProfile(webId, { shallow: true })).returns.resolves.toEqualTypeOf<SolidUserProfile>(); // prettier-ignore
        expectTypeOf(() => solid.requireUserProfile(webId, { shallow: Math.random() > 0.5 })).returns.resolves.toEqualTypeOf<SolidUserProfile>(); // prettier-ignore
    });

    it('creates missing public type indexes', async () => {
        // Arrange
        const user = { ...fullProfile };
        const typeIndex = new TypeIndex(
            { url: 'https://alice.example/settings/publicTypeIndex' },
            { exists: true },
        ) as ModelWithUrl<TypeIndex>;
        const createPublic = vi.spyOn(TypeIndex, 'createPublic').mockResolvedValue(typeIndex);
        const createPrivate = vi.spyOn(TypeIndex, 'createPrivate');

        solid.setState({ session: { user, loginUrl: webId, authenticator: {} as Authenticator } });
        solid.clearTypeIndexesCache();

        // Act
        const createdTypeIndex = await solid.findOrCreatePublicTypeIndex();
        const foundTypeIndex = await solid.findOrCreatePublicTypeIndex();

        // Assert
        expect(createdTypeIndex).toBe(typeIndex);
        expect(foundTypeIndex).toBe(typeIndex);
        expect(createPublic).toHaveBeenCalledOnce();
        expect(createPrivate).not.toHaveBeenCalled();
        expect(solid.profiles[webId]?.publicTypeIndexUrls).toEqual([typeIndex.url]);
        expect(solid.profiles[webId]?.privateTypeIndexUrls).toEqual(fullProfile.privateTypeIndexUrls);
    });

    it.each(['public', 'private'] as const)('creates %s containers', async (visibility) => {
        // Arrange
        const containerUrl = 'https://alice.example/tasks/';
        const publicTypeIndex = new TypeIndex({ url: 'https://alice.example/settings/publicTypeIndex' });
        const privateTypeIndex = new TypeIndex({ url: 'https://alice.example/settings/privateTypeIndex' });
        const updatePublicPermissions = vi.spyOn(Container.prototype, 'updatePublicPermissions').mockResolvedValue();
        const register = vi.spyOn(Container.prototype, 'register').mockResolvedValue();

        vi.spyOn(Container, 'find').mockResolvedValue(null);
        vi.spyOn(Container.prototype, 'save').mockImplementation(async function (this: ModelWithUrl<Container>) {
            return this;
        });
        vi.spyOn(solid, 'requireAuthenticator').mockReturnValue({
            engine: new SolidEngine({ fetch: vi.fn() }),
        } as unknown as Authenticator);
        vi.spyOn(solid, 'findOrCreatePublicTypeIndex').mockResolvedValue(publicTypeIndex as ModelWithUrl<TypeIndex>);
        vi.spyOn(solid, 'findOrCreatePrivateTypeIndex').mockResolvedValue(privateTypeIndex as ModelWithUrl<TypeIndex>);

        // Act
        const container =
            visibility === 'public'
                ? await solid.createPublicContainer({ url: containerUrl, registerFor: Container })
                : await solid.createPrivateContainer({ url: containerUrl, registerFor: Container });

        // Assert
        expect(container.url).toEqual(containerUrl);
        expect(register).toHaveBeenCalledWith(visibility === 'public' ? publicTypeIndex : privateTypeIndex, Container);

        if (visibility === 'public') {
            expect(updatePublicPermissions).toHaveBeenCalledWith([SolidDocumentPermissions.Read]);
        } else {
            expect(updatePublicPermissions).not.toHaveBeenCalled();
        }
    });
});
