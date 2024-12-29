import { randomBytes, createHash } from 'crypto';

export function generateRandomString(length: number): string {
    return randomBytes(length).toString('hex');
}

export function hashString(input: string, hash: string = 'sh256'): string {
    return createHash(hash).update(input).digest('hex');
}