// Allowed edu email domains
export const ALLOWED_EMAIL_DOMAINS = [
    'nst.rishihood.edu.in',
    // Add more domains as needed:
    // 'sitpune.edu.in',
    // 'siu.edu.in',
];

/**
 * Check if email belongs to an allowed edu domain
 */
export function isAllowedEduEmail(email: string): boolean {
    if (!email || !email.includes('@')) return false;

    const domain = email.split('@')[1]?.toLowerCase();
    return ALLOWED_EMAIL_DOMAINS.some(allowed => domain === allowed);
}

/**
 * Get the domain part of an email
 */
export function getEmailDomain(email: string): string {
    return email.split('@')[1] || '';
}

/**
 * Get display message for allowed domains
 */
export function getAllowedDomainsMessage(): string {
    return ALLOWED_EMAIL_DOMAINS.map(d => `@${d}`).join(', ');
}
