export {};

declare global {
    namespace PlaywrightTest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<R, T> {
            toEqualSparql(expected: string): R;
        }
    }
}
