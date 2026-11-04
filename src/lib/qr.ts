// Pure helpers for QR payloads. No Firebase / React imports so they're easy to test.

/** Smart-bag codes: letters/digits/-/_ , 4-40 chars. Doubles as the Firestore doc id. */
export const BAG_CODE_REGEX = /^[A-Z0-9][A-Z0-9_-]{3,39}$/;

/**
 * Normalise whatever a scanner/typed input produced into a bag code.
 * Returns null if it can't possibly be a bag code (e.g. a URL or random text).
 */
export function normalizeBagCode(raw: string): string | null {
    if (!raw) return null;
    const code = raw.trim().toUpperCase();
    return BAG_CODE_REGEX.test(code) ? code : null;
}

const PICKUP_PREFIX = 'RELOOP:TRADE:';
const PICKUP_CODE_REGEX = /^[A-Z0-9]{8}$/;

/** The text encoded in the buyer's pickup QR. */
export function encodePickupQr(tradeId: string, code: string): string {
    return `${PICKUP_PREFIX}${tradeId}:${code}`;
}

/** Parse a scanned pickup QR. Returns null for anything that isn't one. */
export function parsePickupQr(raw: string): { tradeId: string; code: string } | null {
    if (!raw) return null;
    const text = raw.trim();
    if (!text.toUpperCase().startsWith(PICKUP_PREFIX)) return null;
    const rest = text.slice(PICKUP_PREFIX.length);
    const idx = rest.lastIndexOf(':');
    if (idx <= 0) return null;
    const tradeId = rest.slice(0, idx);
    const code = rest.slice(idx + 1).toUpperCase();
    if (!/^[A-Za-z0-9]{10,40}$/.test(tradeId) || !PICKUP_CODE_REGEX.test(code)) return null;
    return { tradeId, code };
}

export function isValidPickupCode(code: string): boolean {
    return PICKUP_CODE_REGEX.test(code.trim().toUpperCase());
}

/** Random 8-char pickup code (no look-alike characters). Uses WebCrypto. */
export function generatePickupCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let out = '';
    for (const b of bytes) out += alphabet[b % alphabet.length];
    return out;
}

/** Coins paid out for a collected bag: 10 coins / kg (must match firestore.rules). */
export const BAG_COINS_PER_KG = 10;
export const BAG_MAX_WEIGHT_KG = 50;

export function bagPayout(weightKg: number): number {
    return Math.floor(weightKg * BAG_COINS_PER_KG);
}

/** Level from XP: every 100 XP is a level (must match firestore.rules bound). */
export function levelFromXp(xp: number): number {
    return Math.floor(xp / 100) + 1;
}
