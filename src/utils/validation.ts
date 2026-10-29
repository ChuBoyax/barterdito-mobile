/**
 * Client-side auth validation. Mirrors the backend limits (RegisterRequest / ResetPasswordRequest)
 * and adds stricter password rules for new passwords only — login never checks strength so
 * existing accounts keep working.
 */

/** RFC 5321 caps an address at 254 characters and the local part at 64. */
const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const CODE_PATTERN = /^\d{6}$/;

export const PASSWORD_MIN_BYTES = 8;
export const PASSWORD_MAX_BYTES = 72;
export const NAME_MAX_LENGTH = 120;

/** Compared after stripping digits and symbols, so "Password1!" and "P@ssw0rd" are caught too. */
const COMMON_PASSWORD_WORDS = new Set([
  'password', 'passwrd', 'pssword', 'psswrd', 'qwerty', 'qwertyuiop', 'asdfgh', 'zxcvbn', 'iloveyou', 'abc', 'abcdef', 'admin',
  'welcome', 'letmein', 'monkey', 'dragon', 'sunshine', 'princess', 'football', 'baseball', 'master', 'secret', 'barterdito',
]);

/** UTF-8 byte length; bcrypt on the backend accepts 8 to 72 bytes. */
export function byteLength(value: string) {
  return new TextEncoder().encode(value).length;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeName(value: string) {
  return value.trim().split(/\s+/).join(' ');
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Email address is required.';
  if (/\s/.test(email)) return 'Email address cannot contain spaces.';
  if (email.length > 254) return 'Email address is too long.';
  const [local = '', ...rest] = email.split('@');
  if (rest.length !== 1) return 'Enter a valid email address, like you@example.com.';
  if (local.length > 64) return 'The part before “@” is too long.';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return 'Enter a valid email address, like you@example.com.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address, like you@example.com.';
  return null;
}

export function validateFullName(value: string): string | null {
  const name = normalizeName(value);
  if (!name) return 'Full name is required.';
  if (name.length < 2) return 'Full name must be at least 2 characters.';
  if (name.length > NAME_MAX_LENGTH) return `Full name must be ${NAME_MAX_LENGTH} characters or fewer.`;
  if (!NAME_PATTERN.test(name)) return 'Use letters, spaces, hyphens, apostrophes, or periods only.';
  if (!/\p{L}.*\p{L}/u.test(name)) return 'Full name must include at least 2 letters.';
  return null;
}

export type PasswordRule = { key: string; label: string; met: boolean };

export function passwordRules(password: string): PasswordRule[] {
  const bytes = byteLength(password);
  return [
    { key: 'length', label: `${PASSWORD_MIN_BYTES}–${PASSWORD_MAX_BYTES} characters`, met: bytes >= PASSWORD_MIN_BYTES && bytes <= PASSWORD_MAX_BYTES },
    { key: 'case', label: 'Upper and lowercase letters', met: /\p{Lu}/u.test(password) && /\p{Ll}/u.test(password) },
    { key: 'number', label: 'At least one number', met: /\d/.test(password) },
    { key: 'symbol', label: 'At least one symbol (e.g. ! @ # ?)', met: /[^\p{L}\p{N}\s]/u.test(password) },
  ];
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/** `rejected` marks a password that meets every rule but is still refused (common, or contains personal info). */
export function passwordStrength(password: string, rejected = false): PasswordStrength {
  if (!password) return { score: 0, label: '' };
  const rules = passwordRules(password);
  const met = rules.filter((rule) => rule.met).length;
  const bonus = byteLength(password) >= 12 ? 1 : 0;
  // A password that still fails a rule never reads better than "Fair"; a refused one reads "Weak".
  const ceiling = met < rules.length ? 2 : rejected ? 1 : 4;
  const score = Math.min(ceiling, Math.max(1, met - 1 + bonus)) as PasswordStrength['score'];
  return { score, label: ['', 'Weak', 'Fair', 'Good', 'Strong'][score] };
}

/** Validates a password being created (sign up or reset). `context` holds personal info it must not contain. */
export function validateNewPassword(password: string, context: { email?: string; fullName?: string } = {}): string | null {
  if (!password) return 'Password is required.';
  if (password !== password.trim()) return 'Password cannot start or end with a space.';
  const bytes = byteLength(password);
  if (bytes < PASSWORD_MIN_BYTES) return `Password must be at least ${PASSWORD_MIN_BYTES} characters.`;
  if (bytes > PASSWORD_MAX_BYTES) return `Password must be ${PASSWORD_MAX_BYTES} characters or fewer.`;
  const unmet = passwordRules(password).find((rule) => !rule.met);
  if (unmet) return `Password needs: ${unmet.label.toLowerCase()}.`;
  const lower = password.toLowerCase();
  // Drop leading/trailing padding ("Password123!"), then undo common swaps ("P@ssw0rd").
  const core = lower.replace(/^[^a-z]+|[^a-z]+$/g, '');
  const unleet = core.replace(/0/g, 'o').replace(/[@4]/g, 'a').replace(/[$5]/g, 's').replace(/[1!]/g, 'i').replace(/3/g, 'e').replace(/[^a-z]/g, '');
  if (COMMON_PASSWORD_WORDS.has(unleet) || /^(.)\1+$/.test(password) || /^\d+[^\d]?$/.test(password)) return 'This password is too common. Choose something harder to guess.';
  const localPart = normalizeEmail(context.email ?? '').split('@')[0];
  if (localPart.length >= 3 && lower.includes(localPart)) return 'Password cannot contain your email address.';
  const nameParts = normalizeName(context.fullName ?? '').toLowerCase().split(' ').filter((part) => part.length >= 3);
  if (nameParts.some((part) => lower.includes(part))) return 'Password cannot contain your name.';
  return null;
}

export function validateLoginPassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (byteLength(password) > PASSWORD_MAX_BYTES) return `Password must be ${PASSWORD_MAX_BYTES} characters or fewer.`;
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please retype your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

export function validateCode(value: string): string | null {
  const code = value.trim();
  if (!code) return 'Verification code is required.';
  if (!CODE_PATTERN.test(code)) return 'Enter the six-digit code you received.';
  return null;
}
