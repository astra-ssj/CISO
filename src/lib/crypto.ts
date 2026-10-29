/**
 * AES-256-GCM encryption/decryption for Integration credentials.
 *
 * The encryption root key is intentionally separate from the Auth.js signing
 * secret so authentication-secret rotation does not make stored connector
 * credentials undecryptable.
 *
 * SERVER-SIDE ONLY — never import this in client components.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(): Buffer {
    const secret = process.env.ASTRA_ENCRYPTION_KEY?.trim();
    if (!secret) {
        throw new Error('ASTRA_ENCRYPTION_KEY is not set — cannot encrypt/decrypt integration credentials');
    }

    // Accept a 64-character hex key directly; otherwise derive a stable 32-byte
    // key from the configured secret without coupling to authentication.
    if (/^[a-fA-F0-9]{64}$/.test(secret)) {
        return Buffer.from(secret, 'hex');
    }
    return createHash('sha256').update(secret, 'utf8').digest();
}

export function encrypt(plaintext: string): string {
    const key = deriveKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString('hex'),
        authTag.toString('hex'),
        encrypted.toString('hex'),
    ].join(':');
}

export function decrypt(ciphertext: string): string {
    if (!ciphertext || ciphertext.trim() === '') return '';

    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format — expected iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = deriveKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString('utf8');
}

export function maskSecret(value: string, showLast = 4): string {
    if (!value || value.length <= showLast) return '****';
    return '•'.repeat(Math.min(value.length - showLast, 12)) + value.slice(-showLast);
}
