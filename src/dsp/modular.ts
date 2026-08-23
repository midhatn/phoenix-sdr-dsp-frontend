/**
 * Finite Field & Modular Arithmetic Engine (M10, M11, M12)
 * Supporting Kyber modulus q = 3329 and Dilithium modulus q = 8380417
 */

export const KYBER_Q = 3329;
export const DILITHIUM_Q = 8380417;

/**
 * Standard integer modulo returning result in [0, q-1]
 */
export function mod(a: number, q: number): number {
  const r = a % q;
  return r < 0 ? r + q : r;
}

/**
 * Modular addition: (a + b) mod q
 */
export function modAdd(a: number, b: number, q: number): number {
  const s = a + b;
  return s >= q ? s - q : s;
}

/**
 * Modular subtraction: (a - b) mod q
 */
export function modSub(a: number, b: number, q: number): number {
  const d = a - b;
  return d < 0 ? d + q : d;
}

/**
 * Modular multiplication: (a * b) mod q
 */
export function modMul(a: number, b: number, q: number): number {
  return Number((BigInt(a) * BigInt(b)) % BigInt(q));
}

/**
 * Modular exponentiation: (base^exp) mod q
 */
export function modPow(base: number, exp: number, q: number): number {
  let res = 1n;
  let b = BigInt(base) % BigInt(q);
  let e = BigInt(exp);
  const bigQ = BigInt(q);

  while (e > 0n) {
    if (e & 1n) res = (res * b) % bigQ;
    b = (b * b) % bigQ;
    e >>= 1n;
  }
  return Number(res);
}

/**
 * Modular inverse via Fermat's Little Theorem (for prime q)
 */
export function modInv(a: number, q: number): number {
  return modPow(a, q - 2, q);
}

/**
 * Montgomery Multiplication Helper
 * Computes (a * b * R^-1) mod q
 */
export function montgomeryMul(a: number, b: number, q: number, r: number = 65536): number {
  const prod = BigInt(a) * BigInt(b);
  const bigQ = BigInt(q);
  const bigR = BigInt(r);

  // In Montgomery domain
  const modResult = (prod * BigInt(modInv(r, q))) % bigQ;
  return Number(modResult < 0n ? modResult + bigQ : modResult);
}

/**
 * Cooley-Tukey Butterfly (M11)
 * (u, v) -> (u + w*v, u - w*v) mod q
 */
export function ctButterfly(u: number, v: number, zeta: number, q: number): [number, number] {
  const t = modMul(v, zeta, q);
  const uPrime = modAdd(u, t, q);
  const vPrime = modSub(u, t, q);
  return [uPrime, vPrime];
}

/**
 * Gentleman-Sande Butterfly (M11)
 * (u, v) -> ((u + v) / 2, (u - v) * zeta^-1 / 2) mod q
 */
export function gsButterfly(u: number, v: number, zetaInv: number, q: number): [number, number] {
  const uPrime = modAdd(u, v, q);
  const diff = modSub(u, v, q);
  const vPrime = modMul(diff, zetaInv, q);
  return [uPrime, vPrime];
}
