export {};

declare global {
    interface Window {
        __aerogelDisableErrorHandling__?: boolean;
        __AEROGEL_E2E__?: boolean;
    }
}
