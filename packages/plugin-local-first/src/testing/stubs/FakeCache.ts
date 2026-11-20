export default class FakeCache {
    public responses = new Map<string, Blob>();

    public async match(url: string): Promise<Response | undefined> {
        const blob = this.responses.get(url);

        return blob && new Response(blob);
    }

    public async put(url: string, response: Response): Promise<void> {
        this.responses.set(url, await response.blob());
    }

    public async keys(url?: string): Promise<string[]> {
        return Array.from(this.responses.keys()).filter((key) => !url || key === url);
    }

    public async delete(url: string): Promise<boolean> {
        return this.responses.delete(url);
    }
}
