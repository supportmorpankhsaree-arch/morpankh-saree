import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createAdminSession, verifyAdminSession } from './adminSession';

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
});
