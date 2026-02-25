import { promises as fs } from 'fs';
import path from 'path';

// ─── Constants ───

const EVIDENCE_ROOT = process.env.EVIDENCE_STORAGE_PATH || path.join(process.cwd(), 'data', 'evidence');

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'image/png',
    'image/jpeg',
    'text/csv',
    'text/plain',
    'application/zip',
]);

const MIME_FROM_EXT: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
};

// ─── Helpers ───

export function getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    return MIME_FROM_EXT[ext] || 'application/octet-stream';
}

export function isAllowedMimeType(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.has(mimeType);
}

export function isAllowedFileSize(size: number): boolean {
    return size <= MAX_FILE_SIZE;
}

/**
 * Build the storage directory path:
 *   /data/evidence/{year}/{month}/{evidenceId}/
 */
function buildDir(evidenceId: string): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return path.join(EVIDENCE_ROOT, year, month, evidenceId);
}

// ─── Public API ───

/**
 * Save a file buffer to the evidence storage.
 * Returns the relative path from EVIDENCE_ROOT.
 */
export async function saveFile(
    buffer: Buffer,
    evidenceId: string,
    originalFileName: string
): Promise<string> {
    const dir = buildDir(evidenceId);
    await fs.mkdir(dir, { recursive: true });
    const safeName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(dir, safeName);
    await fs.writeFile(filePath, buffer);
    return filePath;
}

/**
 * Read a file from storage and return as a Buffer.
 */
export async function readFile(filePath: string): Promise<Buffer> {
    return fs.readFile(filePath);
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
        // Try to clean up empty parent directories
        const dir = path.dirname(filePath);
        const entries = await fs.readdir(dir);
        if (entries.length === 0) {
            await fs.rmdir(dir);
        }
    } catch {
        // Ignore errors — file may already be gone
    }
}

/**
 * Check if a file exists in storage.
 */
export async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * Get the evidence root directory path.
 */
export function getEvidenceRoot(): string {
    return EVIDENCE_ROOT;
}
