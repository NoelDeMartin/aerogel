export {};

declare global {
    namespace PlaywrightTest {
        // oxlint-disable-next-line typescript/no-unused-vars
        interface Matchers<R, T> {
            toEqualSparql(expected: string): R;
        }
    }
}
