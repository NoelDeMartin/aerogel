export function fileResponse(blob: Blob, mimeType?: string | null): Response {
    const contentType = mimeType || blob.type;

    return new Response(blob, contentType ? { headers: { 'Content-Type': contentType } } : undefined);
}
