export function generateModelsVirtualModule(): string {
    return `export default import.meta.glob(['/src/models/*.ts', '!/src/models/*.test.ts', '!/src/models/index.ts'], { eager: true });`;
}

export function generatePatchZodVirtualModule(): string {
    return "import 'soukai-bis/patch-zod';";
}
