export function stripQuery(id: string): string {
    return id.split('?')[0] ?? id;
}
