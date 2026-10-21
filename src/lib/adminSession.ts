const SESSION_COOKIE = 'admin_session';
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
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

export function getAdminSessionCookieName() {
  return SESSION_COOKIE;
}

export function isAdminSessionConfigured() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return Boolean(secret && secret.length >= 32);
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
