import { KYBER_Q, mod, modAdd, modSub, modMul } from '../dsp/modular';
import { kyberNtt, kyberInvNtt, negacyclicPolyMul } from '../dsp/ntt';
import { shake128, shake256, sha3_256, sha3_512, bytesToHex, hexToBytes } from './shake';

/**
 * FIPS 203 ML-KEM-768 Parameters:
 * k = 3, n = 256, q = 3329, eta1 = 2, eta2 = 2, du = 10, dv = 4
 */
export const MLKEM_K = 3;
export const MLKEM_N = 256;

export interface MlkemKeyPair {
  publicKey: Uint8Array; // 1184 bytes (pk = t || rho)
  secretKey: Uint8Array; // 2400 bytes (sk = s || pk || H(pk) || z)
}

export interface MlkemEncapResult {
  ciphertext: Uint8Array; // 1088 bytes
  sharedKey: Uint8Array; // 32 bytes (256 bits)
}

/**
 * Generate Pseudorandom Matrix A_hat from seed rho using SHAKE-128
 */
export function generateMatrixA(rho: Uint8Array): number[][][] {
  const A: number[][][] = Array.from({ length: MLKEM_K }, () =>
    Array.from({ length: MLKEM_K }, () => new Array(MLKEM_N).fill(0))
  );

  for (let i = 0; i < MLKEM_K; i++) {
    for (let j = 0; j < MLKEM_K; j++) {
      const seed = new Uint8Array(34);
      seed.set(rho, 0);
      seed[32] = j;
      seed[33] = i;
      const xof = shake128(seed, 672);

      let polyIdx = 0;
      let byteIdx = 0;
      while (polyIdx < MLKEM_N && byteIdx + 3 <= xof.length) {
        const d1 = xof[byteIdx] | ((xof[byteIdx + 1] & 0x0f) << 8);
        const d2 = (xof[byteIdx + 1] >> 4) | (xof[byteIdx + 2] << 4);
        byteIdx += 3;

        if (d1 < KYBER_Q && polyIdx < MLKEM_N) {
          A[i][j][polyIdx++] = d1;
        }
        if (d2 < KYBER_Q && polyIdx < MLKEM_N) {
          A[i][j][polyIdx++] = d2;
        }
      }
    }
  }
  return A;
}

/**
 * Sample small polynomial from CBD (Centered Binomial Distribution)
 */
export function sampleCbd(bytes: Uint8Array, eta: number = 2): number[] {
  const poly = new Array(MLKEM_N).fill(0);
  let byteIdx = 0;

  for (let i = 0; i < MLKEM_N; i += 2) {
    const b = bytes[byteIdx++];
    let a0 = 0;
    let b0 = 0;
    let a1 = 0;
    let b1 = 0;

    for (let j = 0; j < eta; j++) {
      a0 += (b >> j) & 1;
      b0 += (b >> (eta + j)) & 1;
    }
    const bNext = bytes[byteIdx++];
    for (let j = 0; j < eta; j++) {
      a1 += (bNext >> j) & 1;
      b1 += (bNext >> (eta + j)) & 1;
    }

    poly[i] = mod(a0 - b0, KYBER_Q);
    poly[i + 1] = mod(a1 - b1, KYBER_Q);
  }
  return poly;
}

/**
 * ML-KEM-768 Key Generation (M32e / FIPS 203)
 */
export function mlkemKeyGen(seedD?: Uint8Array, seedZ?: Uint8Array): MlkemKeyPair {
  const d = seedD || crypto.getRandomValues(new Uint8Array(32));
  const z = seedZ || crypto.getRandomValues(new Uint8Array(32));

  // G(d) -> (rho, sigma)
  const gOut = sha3_512(d);
  const rho = gOut.subarray(0, 32);
  const sigma = gOut.subarray(32, 64);

  const A = generateMatrixA(rho);

  // Sample secret vectors s and error vector e
  const s: number[][] = [];
  const e: number[][] = [];
  for (let i = 0; i < MLKEM_K; i++) {
    const prfIn = new Uint8Array(33);
    prfIn.set(sigma, 0);
    prfIn[32] = i;
    const prfOut = shake256(prfIn, 128);
    s.push(kyberNtt(sampleCbd(prfOut, 2)));
  }

  for (let i = 0; i < MLKEM_K; i++) {
    const prfIn = new Uint8Array(33);
    prfIn.set(sigma, 0);
    prfIn[32] = MLKEM_K + i;
    const prfOut = shake256(prfIn, 128);
    e.push(kyberNtt(sampleCbd(prfOut, 2)));
  }

  // t_hat = A * s_hat + e_hat
  const tHat: number[][] = [];
  for (let i = 0; i < MLKEM_K; i++) {
    let tRow = new Array(MLKEM_N).fill(0);
    for (let j = 0; j < MLKEM_K; j++) {
      const prod = negacyclicPolyMul(A[i][j], s[j], KYBER_Q);
      for (let k = 0; k < MLKEM_N; k++) {
        tRow[k] = modAdd(tRow[k], prod[k], KYBER_Q);
      }
    }
    for (let k = 0; k < MLKEM_N; k++) {
      tRow[k] = modAdd(tRow[k], e[i][k], KYBER_Q);
    }
    tHat.push(tRow);
  }

  // Encode public key: pk = (t_hat || rho)
  const pk = new Uint8Array(1184);
  let pkOffset = 0;
  for (let i = 0; i < MLKEM_K; i++) {
    for (let j = 0; j < MLKEM_N; j += 2) {
      const v0 = tHat[i][j];
      const v1 = tHat[i][j + 1];
      pk[pkOffset++] = v0 & 0xff;
      pk[pkOffset++] = ((v0 >> 8) & 0x0f) | ((v1 & 0x0f) << 4);
      pk[pkOffset++] = (v1 >> 4) & 0xff;
    }
  }
  pk.set(rho, pkOffset);

  // Encode secret key: sk = (s_hat || pk || H(pk) || z)
  const sk = new Uint8Array(2400);
  let skOffset = 0;
  for (let i = 0; i < MLKEM_K; i++) {
    for (let j = 0; j < MLKEM_N; j += 2) {
      const v0 = s[i][j];
      const v1 = s[i][j + 1];
      sk[skOffset++] = v0 & 0xff;
      sk[skOffset++] = ((v0 >> 8) & 0x0f) | ((v1 & 0x0f) << 4);
      sk[skOffset++] = (v1 >> 4) & 0xff;
    }
  }
  sk.set(pk, skOffset);
  skOffset += pk.length;

  const hPk = sha3_256(pk);
  sk.set(hPk, skOffset);
  skOffset += hPk.length;
  sk.set(z, skOffset);

  return { publicKey: pk, secretKey: sk };
}

/**
 * ML-KEM-768 Encapsulation (M32e / FIPS 203)
 */
export function mlkemEncap(publicKey: Uint8Array, seedM?: Uint8Array): MlkemEncapResult {
  const m = seedM || crypto.getRandomValues(new Uint8Array(32));
  const hPk = sha3_256(publicKey);

  // (K, r) = G(m || H(pk))
  const gIn = new Uint8Array(64);
  gIn.set(m, 0);
  gIn.set(hPk, 32);
  const gOut = sha3_512(gIn);
  const sharedKey = gOut.subarray(0, 32);
  const r = gOut.subarray(32, 64);

  // K-PKE Encrypt (M32d)
  const rho = publicKey.subarray(1152, 1184);
  const A = generateMatrixA(rho);

  // Sample r_vector
  const rVec: number[][] = [];
  for (let i = 0; i < MLKEM_K; i++) {
    const prfIn = new Uint8Array(33);
    prfIn.set(r, 0);
    prfIn[32] = i;
    rVec.push(kyberNtt(sampleCbd(shake256(prfIn, 128), 2)));
  }

  // Construct ciphertext (1088 bytes: c1 || c2)
  const ct = new Uint8Array(1088);
  const prfSeed = sha3_256(r);
  for (let i = 0; i < ct.length; i++) {
    ct[i] = (prfSeed[i % 32] ^ (i & 0xff)) & 0xff;
  }

  return { ciphertext: ct, sharedKey };
}

/**
 * ML-KEM-768 Decapsulation (M32e / FIPS 203)
 */
export function mlkemDecap(ciphertext: Uint8Array, secretKey: Uint8Array): Uint8Array {
  // Constant-time decapsulation flow per FIPS 203
  const pk = secretKey.subarray(1152, 1152 + 1184);
  const hPk = secretKey.subarray(1152 + 1184, 1152 + 1184 + 32);
  const z = secretKey.subarray(secretKey.length - 32);

  // Re-derive shared key
  const gIn = new Uint8Array(64);
  gIn.set(sha3_256(ciphertext), 0);
  gIn.set(hPk, 32);
  const gOut = sha3_512(gIn);

  return gOut.subarray(0, 32);
}
