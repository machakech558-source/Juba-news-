import crypto from 'crypto';
import { config } from '../config/env';

export class CryptoService {
  /**
   * Securely hashes a password using scrypt with a unique cryptographically random salt.
   * Format: salt:hash (hex encoded)
   */
  static async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * Verifies password against stored salt:hash using constant-time comparison
   */
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const [salt, key] = storedHash.split(':');
        if (!salt || !key) return resolve(false);

        crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
          if (err) return resolve(false);
          const keyBuffer = Buffer.from(key, 'hex');
          if (keyBuffer.length !== derivedKey.length) return resolve(false);
          resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
        });
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Generates a cryptographically strong random token
   */
  static generateRandomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Base64URL encoding helper
   */
  private static base64UrlEncode(str: string | Buffer): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private static base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64').toString('utf8');
  }

  /**
   * Generates a signed JWT access token
   */
  static signJwt(payload: Record<string, any>, expiresInSeconds: number = config.accessTokenExpiresInMinutes * 60): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(body));
    const signature = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const encodedSignature = this.base64UrlEncode(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  /**
   * Verifies and decodes a signed JWT
   */
  static verifyJwt(token: string): { valid: boolean; payload?: any; expired?: boolean } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return { valid: false };

      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      const expectedSignature = this.base64UrlEncode(
        crypto
          .createHmac('sha256', config.jwtSecret)
          .update(`${encodedHeader}.${encodedPayload}`)
          .digest()
      );

      // Constant-time signature comparison
      const sigA = Buffer.from(encodedSignature);
      const sigB = Buffer.from(expectedSignature);
      if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
        return { valid: false };
      }

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, expired: true, payload };
      }

      return { valid: true, payload };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Generates RFC 6238 compatible TOTP secret (base32)
   */
  static generateTotpSecret(): { secret: string; uri: string } {
    const buffer = crypto.randomBytes(20);
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < buffer.length; i++) {
      secret += base32Chars[buffer[i] % 32];
    }
    const uri = `otpauth://totp/JubaNews:${encodeURIComponent(config.initialSuperAdminEmail)}?secret=${secret}&issuer=JubaNews`;
    return { secret, uri };
  }

  /**
   * Verifies a 6-digit TOTP code against secret
   */
  static verifyTotpCode(secret: string, code: string, windowSteps: number = 1): boolean {
    if (!secret || !code || code.length !== 6) return false;
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (let i = 0; i < secret.length; i++) {
      const val = base32Chars.indexOf(secret.charAt(i).toUpperCase());
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const keyBytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      keyBytes.push(parseInt(bits.substr(i, 8), 2));
    }
    const key = Buffer.from(keyBytes);

    const currentTimeStep = Math.floor(Date.now() / 1000 / 30);
    for (let offset = -windowSteps; offset <= windowSteps; offset++) {
      const step = currentTimeStep + offset;
      const stepBuf = Buffer.alloc(8);
      stepBuf.writeBigInt64BE(BigInt(step));

      const hmac = crypto.createHmac('sha1', key).update(stepBuf).digest();
      const codeOffset = hmac[hmac.length - 1] & 0x0f;
      const binary =
        ((hmac[codeOffset] & 0x7f) << 24) |
        ((hmac[codeOffset + 1] & 0xff) << 16) |
        ((hmac[codeOffset + 2] & 0xff) << 8) |
        (hmac[codeOffset + 3] & 0xff);

      const generatedCode = (binary % 1000000).toString().padStart(6, '0');
      if (generatedCode === code.trim()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates a set of 8 random single-use backup recovery codes
   */
  static generateBackupCodes(count: number = 8): { rawCodes: string[]; hashedCodes: string[] } {
    const rawCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = `${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      rawCodes.push(code);
      const hash = crypto.createHash('sha256').update(code).digest('hex');
      hashedCodes.push(hash);
    }

    return { rawCodes, hashedCodes };
  }

  /**
   * Verifies a backup recovery code against stored hashes
   */
  static verifyBackupCode(code: string, hashedCodes: string[]): { valid: boolean; matchingHash?: string } {
    const normalized = code.trim().toUpperCase();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    const index = hashedCodes.indexOf(hash);
    if (index !== -1) {
      return { valid: true, matchingHash: hash };
    }
    return { valid: false };
  }
}
