const SESSION_COOKIE = 'admin_session';
const OTP_CHALLENGE_COOKIE = 'admin_otp_challenge';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const OTP_CHALLENGE_DURATION_SECONDS = 10 * 60;
const encoder = new TextEncoder();

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters');
  }
  return secret;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function getEncryptionKey() {
  const secretDigest = await crypto.subtle.digest('SHA-256', encoder.encode(getSessionSecret()));
  return crypto.subtle.importKey('raw', secretDigest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export function getAdminSessionCookieName() {
  return SESSION_COOKIE;
}

export function getAdminOtpChallengeCookieName() {
  return OTP_CHALLENGE_COOKIE;
}

export function getAdminOtpChallengeDurationSeconds() {
  return OTP_CHALLENGE_DURATION_SECONDS;
}

export function isAdminSessionConfigured() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(secret && secret.length >= 32);
}

export async function createAdminOtpChallenge(email: string, otp: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = encoder.encode(JSON.stringify({
    email,
    otp,
    exp: issuedAt + OTP_CHALLENGE_DURATION_SECONDS,
  }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getEncryptionKey(),
    payload
  );
  return `${encodeBase64Url(iv)}.${encodeBase64Url(new Uint8Array(ciphertext))}`;
}

export async function verifyAdminOtpChallenge(token: string | undefined, email: string, otp: string) {
  if (!token) return 'missing' as const;

  try {
    const [encodedIv, encodedCiphertext, ...extraParts] = token.split('.');
    if (!encodedIv || !encodedCiphertext || extraParts.length > 0) return 'invalid' as const;

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decodeBase64Url(encodedIv) },
      await getEncryptionKey(),
      decodeBase64Url(encodedCiphertext)
    );
    const payload: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('email' in payload) ||
      payload.email !== email ||
      !('otp' in payload) ||
      typeof payload.otp !== 'string' ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number'
    ) {
      return 'invalid' as const;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) return 'expired' as const;
    return payload.otp === otp ? 'valid' as const : 'invalid' as const;
  } catch {
    return 'invalid' as const;
  }
}

export async function createAdminSession(email: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const payload = encodeBase64Url(
    encoder.encode(JSON.stringify({
      sub: 'admin',
      email,
      iat: issuedAt,
      exp: issuedAt + SESSION_DURATION_SECONDS,
    }))
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await getSigningKey(),
    encoder.encode(unsignedToken)
  );

  return `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(token?: string) {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const header: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const payload: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (
      !header ||
      typeof header !== 'object' ||
      !('alg' in header) ||
      header.alg !== 'HS256' ||
      !payload ||
      typeof payload !== 'object' ||
      !('sub' in payload) ||
      payload.sub !== 'admin' ||
      !('exp' in payload) ||
      typeof payload.exp !== 'number' ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return false;
    }

    return crypto.subtle.verify(
      'HMAC',
      await getSigningKey(),
      decodeBase64Url(parts[2]),
      encoder.encode(`${parts[0]}.${parts[1]}`)
    );
  } catch {
    return false;
  }
}
