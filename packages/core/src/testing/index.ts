import { definePlugin } from '@/plugins';

export interface AerogelTestingRuntime {}

export default definePlugin({
    async install() {
        if (import.meta.env.MODE !== 'testing') {
            return;
        }

        window.testingRuntime = {};
    },
});

declare global {
    interface Window {
        testingRuntime?: AerogelTestingRuntime;
    }
}
