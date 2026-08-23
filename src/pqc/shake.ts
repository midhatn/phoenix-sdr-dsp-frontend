/**
 * FIPS 202 Keccak / SHAKE-128 and SHAKE-256 Extendable-Output Function (XOF)
 * Milestone 32c implementation
 */

// Round constants for Keccak-f[1600]
const RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

// Rotation offsets
const RHO_OFFSETS: number[][] = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

function rotl64(x: bigint, n: number): bigint {
  const bigN = BigInt(n % 64);
  return ((x << bigN) | (x >> (64n - bigN))) & 0xffffffffffffffffn;
}

function keccakF1600(state: bigint[][]): void {
  const c: bigint[] = new Array(5).fill(0n);
  const d: bigint[] = new Array(5).fill(0n);
  const b: bigint[][] = Array.from({ length: 5 }, () => new Array(5).fill(0n));

  for (let round = 0; round < 24; round++) {
    // Theta step
    for (let x = 0; x < 5; x++) {
      c[x] = state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4];
    }
    for (let x = 0; x < 5; x++) {
      d[x] = c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1);
    }
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[x][y] ^= d[x];
      }
    }

    // Rho and Pi steps
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        b[y][(2 * x + 3 * y) % 5] = rotl64(state[x][y], RHO_OFFSETS[x][y]);
      }
    }

    // Chi step
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[x][y] = b[x][y] ^ (~b[(x + 1) % 5][y] & b[(x + 2) % 5][y]);
      }
    }

    // Iota step
    state[0][0] ^= RC[round];
  }
}

/**
 * Absorb and Squeeze for SHAKE
 */
function shake(inputBytes: Uint8Array, rateBytes: number, outputLength: number, domainDelim: number = 0x1f): Uint8Array {
  const state: bigint[][] = Array.from({ length: 5 }, () => new Array(5).fill(0n));
  let block = new Uint8Array(rateBytes);
  let offset = 0;

  // Absorb full blocks
  while (offset + rateBytes <= inputBytes.length) {
    for (let i = 0; i < rateBytes / 8; i++) {
      let word = 0n;
      for (let b = 0; b < 8; b++) {
        word |= BigInt(inputBytes[offset + i * 8 + b]) << BigInt(b * 8);
      }
      const x = i % 5;
      const y = Math.floor(i / 5);
      state[x][y] ^= word;
    }
    keccakF1600(state);
    offset += rateBytes;
  }

  // Absorb remainder and pad
  const rem = inputBytes.length - offset;
  block.fill(0);
  block.set(inputBytes.subarray(offset), 0);
  block[rem] = domainDelim;
  block[rateBytes - 1] |= 0x80;

  for (let i = 0; i < rateBytes / 8; i++) {
    let word = 0n;
    for (let b = 0; b < 8; b++) {
      word |= BigInt(block[i * 8 + b]) << BigInt(b * 8);
    }
    const x = i % 5;
    const y = Math.floor(i / 5);
    state[x][y] ^= word;
  }
  keccakF1600(state);

  // Squeeze output bytes
  const out = new Uint8Array(outputLength);
  let squeezed = 0;

  while (squeezed < outputLength) {
    const toCopy = Math.min(rateBytes, outputLength - squeezed);
    const tempBlock = new Uint8Array(rateBytes);
    for (let i = 0; i < rateBytes / 8; i++) {
      const x = i % 5;
      const y = Math.floor(i / 5);
      const word = state[x][y];
      for (let b = 0; b < 8; b++) {
        tempBlock[i * 8 + b] = Number((word >> BigInt(b * 8)) & 0xffn);
      }
    }
    out.set(tempBlock.subarray(0, toCopy), squeezed);
    squeezed += toCopy;
    if (squeezed < outputLength) {
      keccakF1600(state);
    }
  }

  return out;
}

/**
 * SHAKE-128 (rate = 1344 bits = 168 bytes)
 */
export function shake128(input: Uint8Array | string, outLen: number = 32): Uint8Array {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return shake(bytes, 168, outLen, 0x1f);
}

/**
 * SHAKE-256 (rate = 1088 bits = 136 bytes)
 */
export function shake256(input: Uint8Array | string, outLen: number = 64): Uint8Array {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return shake(bytes, 136, outLen, 0x1f);
}

/**
 * SHA3-256 hash
 */
export function sha3_256(input: Uint8Array | string): Uint8Array {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return shake(bytes, 136, 32, 0x06);
}

/**
 * SHA3-512 hash
 */
export function sha3_512(input: Uint8Array | string): Uint8Array {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  return shake(bytes, 72, 64, 0x06);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
