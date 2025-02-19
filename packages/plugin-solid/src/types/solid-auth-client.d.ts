declare module 'solid-auth-client' {
    export type Session = {
        webId: string;
    };

    export class SolidAuthClient {

        public fetch(...args: any[]): Promise<Response>;

        public login(loginUrl: string): Promise<Session | void>;

        public currentSession(): Promise<Session | void>;

        public logout(): Promise<void>;
    
    }

    const auth: SolidAuthClient;

    export default auth;
}
