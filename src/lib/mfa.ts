import crypto from "crypto";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";

const MFA_ISSUER = process.env.MFA_ISSUER ?? "LS Nexus";
const TOTP_ALGORITHM = "SHA1";
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_WINDOW = 1; // ±30s drift tolerance

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 10;

function getEncryptionKey(): Buffer {
  const raw = process.env.MFA_SECRET_KEY;
  if (!raw) {
    throw new Error(
      "MFA_SECRET_KEY is not set. Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("MFA_SECRET_KEY must decode to exactly 32 bytes");
  }
  return key;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: base64(iv).base64(authTag).base64(ciphertext)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted MFA secret");
  }
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(ctB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export interface GeneratedSecret {
  base32: string;
  otpauthUrl: string;
}

export function generateSecret(label: string): GeneratedSecret {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: MFA_ISSUER,
    label,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret,
  });
  return {
    base32: secret.base32,
    otpauthUrl: totp.toString(),
  };
}

export function verifyTotp(encryptedSecret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  let base32: string;
  try {
    base32 = decryptSecret(encryptedSecret);
  } catch {
    return false;
  }
  const totp = new OTPAuth.TOTP({
    issuer: MFA_ISSUER,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(base32),
  });
  const delta = totp.validate({ token: code, window: TOTP_WINDOW });
  return delta !== null;
}

/**
 * Verify a TOTP code against a plaintext base32 secret.
 * Used during the enrollment flow before the secret is persisted.
 */
export function verifyTotpFromBase32(base32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  let totp: OTPAuth.TOTP;
  try {
    totp = new OTPAuth.TOTP({
      issuer: MFA_ISSUER,
      algorithm: TOTP_ALGORITHM,
      digits: TOTP_DIGITS,
      period: TOTP_PERIOD,
      secret: OTPAuth.Secret.fromBase32(base32),
    });
  } catch {
    return false;
  }
  return totp.validate({ token: code, window: TOTP_WINDOW }) !== null;
}

export interface GeneratedBackupCodes {
  plain: string[];
  hashed: string[];
}

/** 10 alphanumeric uppercase codes, 10 chars each (no ambiguous chars). */
export function generateBackupCodes(
  count: number = BACKUP_CODE_COUNT
): GeneratedBackupCodes {
  // Excludes 0/O/1/I/L for readability when users transcribe codes.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const plain: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(BACKUP_CODE_LENGTH);
    let code = "";
    for (let j = 0; j < BACKUP_CODE_LENGTH; j++) {
      code += alphabet[bytes[j] % alphabet.length];
    }
    plain.push(code);
  }
  const hashed = plain.map((c) => bcrypt.hashSync(c, 10));
  return { plain, hashed };
}

export function normalizeBackupCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

export const MFA_CONFIG = {
  issuer: MFA_ISSUER,
  totp: {
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    window: TOTP_WINDOW,
  },
  backupCodes: {
    count: BACKUP_CODE_COUNT,
    length: BACKUP_CODE_LENGTH,
  },
} as const;
