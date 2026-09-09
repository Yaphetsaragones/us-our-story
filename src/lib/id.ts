/** Small, dependency-free id + invite-code helpers. */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — easier to read aloud

export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${prefix ? '_' : ''}${time}${rand}`;
}

/** Human-friendly invite code, e.g. "L7QK-92MB". */
export function inviteCode(): string {
  const block = () =>
    Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  return `${block()}-${block()}`;
}

export function normalizeCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4, 8)}` : clean;
}

export function inviteLink(code: string): string {
  return `usourstory://join/${code}`;
}

/**
 * Non-cryptographic digest, used only to avoid storing a passcode in the clear.
 * The passcode is a local convenience lock, not a key to encrypted data.
 */
export function digest(value: string, salt: string): string {
  const input = `${salt}:${value}:${salt}`;
  /* eslint-disable no-bitwise -- an FNV-style mix is bitwise by definition */
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c + i, 0x85ebca6b) >>> 0;
  }
  /* eslint-enable no-bitwise */
  return `${h1.toString(16).padStart(8, '0')}${h2.toString(16).padStart(8, '0')}`;
}

export function randomSalt(): string {
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
