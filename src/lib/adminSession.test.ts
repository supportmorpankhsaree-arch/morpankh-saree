import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  createAdminOtpChallenge,
  createAdminSession,
  verifyAdminOtpChallenge,
  verifyAdminSession,
} from './adminSession';

const previousSecret = process.env.ADMIN_SESSION_SECRET;

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-that-is-at-least-32-characters-long';
});

afterAll(() => {
  if (previousSecret === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
});

describe('admin sessions', () => {
  it('accepts a signed session and rejects a modified token', async () => {
    const token = await createAdminSession('admin@example.com');
    const [header, payload, signature] = token.split('.');
    const changedSignature = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;

    expect(await verifyAdminSession(token)).toBe(true);
    expect(await verifyAdminSession(`${header}.${payload}.${changedSignature}`)).toBe(false);
  });

  it('rejects missing tokens', async () => {
    expect(await verifyAdminSession()).toBe(false);
  });

  it('validates the encrypted OTP challenge against the email and code', async () => {
    const challenge = await createAdminOtpChallenge('admin@example.com', '123456');

    expect(await verifyAdminOtpChallenge(challenge, 'admin@example.com', '123456')).toBe('valid');
    expect(await verifyAdminOtpChallenge(challenge, 'admin@example.com', '654321')).toBe('invalid');
    expect(await verifyAdminOtpChallenge(challenge, 'other@example.com', '123456')).toBe('invalid');
  });
});
