export function generateMessagesVirtualModule(): string {
    return `export default import.meta.glob('/src/lang/*.yaml');`;
}
