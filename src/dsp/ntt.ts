import { KYBER_Q, DILITHIUM_Q, mod, modAdd, modSub, modMul, modPow, modInv } from './modular';

/**
 * Bit-reversal permutation for array of length n (power of 2)
 */
export function bitReverse<T>(arr: T[]): T[] {
  const n = arr.length;
  const result = [...arr];
  const bits = Math.log2(n);

  for (let i = 0; i < n; i++) {
    let rev = 0;
    for (let b = 0; b < bits; b++) {
      if ((i >> b) & 1) {
        rev |= 1 << (bits - 1 - b);
      }
    }
    if (i < rev) {
      const temp = result[i];
      result[i] = result[rev];
      result[rev] = temp;
    }
  }
  return result;
}

/**
 * Generate primitive 2n-th root of unity modulo q
 */
export function findPrimitiveRoot(n: number, q: number): number {
  for (let g = 2; g < q; g++) {
    if (modPow(g, (q - 1) / (2 * n), q) !== 1) {
      if (modPow(g, q - 1, q) === 1) {
        const root = modPow(g, (q - 1) / (2 * n), q);
        if (modPow(root, n, q) === q - 1) {
          return root;
        }
      }
    }
  }
  return 17; // fallback for standard Kyber
}

/**
 * Generic Number Theoretic Transform (NTT) — Forward
 */
export function forwardNtt(poly: number[], q: number = KYBER_Q): number[] {
  const n = poly.length;
  const a = bitReverse(poly);
  const root = findPrimitiveRoot(n, q);

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const wLen = modPow(root, (2 * n) / len, q);

    for (let i = 0; i < n; i += len) {
      let w = 1;
      for (let j = 0; j < half; j++) {
        const u = a[i + j];
        const v = modMul(a[i + j + half], w, q);
        a[i + j] = modAdd(u, v, q);
        a[i + j + half] = modSub(u, v, q);
        w = modMul(w, wLen, q);
      }
    }
  }
  return a;
}

/**
 * Generic Inverse Number Theoretic Transform (InvNTT)
 */
export function inverseNtt(poly: number[], q: number = KYBER_Q): number[] {
  const n = poly.length;
  const a = bitReverse(poly);
  const root = modInv(findPrimitiveRoot(n, q), q);

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const wLen = modPow(root, (2 * n) / len, q);

    for (let i = 0; i < n; i += len) {
      let w = 1;
      for (let j = 0; j < half; j++) {
        const u = a[i + j];
        const v = modMul(a[i + j + half], w, q);
        a[i + j] = modAdd(u, v, q);
        a[i + j + half] = modSub(u, v, q);
        w = modMul(w, wLen, q);
      }
    }
  }

  const nInv = modInv(n, q);
  return a.map((val) => modMul(val, nInv, q));
}

/**
 * ML-KEM Kyber-768 NTT (N = 256, q = 3329) — M32b
 */
export function kyberNtt(poly: number[]): number[] {
  return forwardNtt(poly, KYBER_Q);
}

export function kyberInvNtt(poly: number[]): number[] {
  return inverseNtt(poly, KYBER_Q);
}

/**
 * ML-DSA Dilithium NTT (N = 256, q = 8380417) — M33a
 */
export function dilithiumNtt(poly: number[]): number[] {
  return forwardNtt(poly, DILITHIUM_Q);
}

export function dilithiumInvNtt(poly: number[]): number[] {
  return inverseNtt(poly, DILITHIUM_Q);
}

/**
 * Schoolbook Polynomial Multiplication (M15)
 */
export function schoolbookPolyMul(a: number[], b: number[], q: number = KYBER_Q): number[] {
  const n = a.length;
  const m = b.length;
  const res = new Array(n + m - 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      res[i + j] = modAdd(res[i + j], modMul(a[i], b[j], q), q);
    }
  }
  return res;
}

/**
 * Negacyclic Polynomial Multiplication mod (X^N + 1, q) — M15b
 */
export function negacyclicPolyMul(a: number[], b: number[], q: number = KYBER_Q): number[] {
  const n = a.length;
  const raw = schoolbookPolyMul(a, b, q);
  const out = new Array(n).fill(0);

  for (let i = 0; i < raw.length; i++) {
    const deg = i % n;
    const sign = Math.floor(i / n) % 2 === 1 ? -1 : 1;
    if (sign === 1) {
      out[deg] = modAdd(out[deg], raw[i], q);
    } else {
      out[deg] = modSub(out[deg], raw[i], q);
    }
  }
  return out;
}
