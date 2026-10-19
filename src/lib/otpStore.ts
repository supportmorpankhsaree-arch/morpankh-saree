interface MemoryOtp {
  otpHash: string;
  expiresAt: Date;
}

const globalForOtp = globalThis as typeof globalThis & {
  adminOtpMemoryStore?: Map<string, MemoryOtp>;
};

if (!globalForOtp.adminOtpMemoryStore) {
  globalForOtp.adminOtpMemoryStore = new Map();
}

export function saveMemoryOtp(email: string, otpHash: string, expiresAt: Date) {
  globalForOtp.adminOtpMemoryStore!.set(email.toLowerCase(), { otpHash, expiresAt });
}

export function getMemoryOtp(email: string): MemoryOtp | undefined {
  const item = globalForOtp.adminOtpMemoryStore!.get(email.toLowerCase());
  if (!item) return undefined;
  if (item.expiresAt.getTime() <= Date.now()) {
    globalForOtp.adminOtpMemoryStore!.delete(email.toLowerCase());
    return undefined;
  }
  return item;
}

export function deleteMemoryOtp(email: string) {
  globalForOtp.adminOtpMemoryStore!.delete(email.toLowerCase());
}
