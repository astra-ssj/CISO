/**
 * AES-256-GCM encryption/decryption for Integration credentials.
 * Key is derived from NEXTAUTH_SECRET using scrypt.
 * Output format: iv:authTag:ciphertext (all hex-encoded, colon-separated)
 *
 * SERVER-SIDE ONLY — never import this in client components.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;   // 96-bit IV for GCM
const SALT = 'astra-ciso-integration-hub-v1'; // fixed salt (key is already a secret)

function deriveKey(): Buffer {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
        throw new Error('NEXTAUTH_SECRET is not set — cannot encrypt/decrypt integration credentials');
    }
    return scryptSync(secret, SALT, 32); // 256-bit key
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns: `iv:authTag:ciphertext` (all hex-encoded)
 */
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

/**
 * Decrypts a ciphertext string produced by `encrypt()`.
 * Expects: `iv:authTag:ciphertext` (all hex-encoded)
 */
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

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Masks a secret value by showing only the last N characters.
 * Used for API responses to avoid leaking credentials.
 */
export function maskSecret(value: string, showLast = 4): string {
    if (!value || value.length <= showLast) return '****';
    return '•'.repeat(Math.min(value.length - showLast, 12)) + value.slice(-showLast);
}
