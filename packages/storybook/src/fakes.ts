export interface ServiceFake {
    install(): () => void;
}

/**
 * Declares a service fake for stories, using the `fakes` parameter.
 *
 * Fakes are installed before the app is bootstrapped, so services are booted using a fresh instance of the fake. The
 * original instance is restored once the story is unmounted.
 *
 * Fakes are global, so stories using them shouldn't be rendered alongside other stories (for example, in docs pages).
 */
export function fakeService<T extends object>(
    service: { requireInstance(): T; setInstance(instance: T): T },
    fake: { reset(): NoInfer<T> },
): ServiceFake {
    return {
        install() {
            const original = service.requireInstance();

            service.setInstance(fake.reset());

            return () => service.setInstance(original);
        },
    };
}
