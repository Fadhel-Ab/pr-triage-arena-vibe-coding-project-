import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// scrypt is built into Node and deliberately slow + memory-hard, so a leaked
// table can't be brute-forced cheaply. No extra dependency needed.
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

// Format "scrypt$<salt hex>$<hash hex>" so the algorithm can change later
// without a migration: old rows still say how they were hashed.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length);
  // Constant-time compare so response timing doesn't reveal how many bytes matched.
  return timingSafeEqual(actual, expected);
}
