import * as crypto from 'crypto';

/**
 * Validates if the phone number is in E.164 format (e.g. +919876543210)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Generates a cryptographically secure random string (useful for tokens / API keys)
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Hashes data using SHA-256
 */
export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
