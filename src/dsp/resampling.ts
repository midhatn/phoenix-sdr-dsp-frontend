import { Complex } from '../types';
import { cMul, cExp } from './complex';
import { KAISER_16_TAPS } from './fir';

/**
 * Polyphase Decimator (M = 4)
 */
export function polyphaseDecimator(
  input: Complex[],
  decimFactor: number = 4,
  taps: Float64Array = KAISER_16_TAPS
): Complex[] {
  const numTaps = taps.length;
  const numBranches = decimFactor;
  const tapsPerBranch = Math.floor(numTaps / numBranches);
  const outLength = Math.floor(input.length / decimFactor);
  const out: Complex[] = new Array(outLength);

  // Decompose filter into polyphase branches
  const branches: number[][] = Array.from({ length: numBranches }, () => []);
  for (let k = 0; k < numTaps; k++) {
    branches[k % numBranches].push(taps[k]);
  }

  for (let m = 0; m < outLength; m++) {
    let sumRe = 0;
    let sumIm = 0;
    for (let p = 0; p < numBranches; p++) {
      const branchTaps = branches[p];
      for (let k = 0; k < tapsPerBranch; k++) {
        const sampleIdx = m * decimFactor - (k * decimFactor + p);
        if (sampleIdx >= 0 && sampleIdx < input.length) {
          const sample = input[sampleIdx];
          const tap = branchTaps[k];
          sumRe += sample.re * tap;
          sumIm += sample.im * tap;
        }
      }
    }
    out[m] = { re: sumRe, im: sumIm };
  }

  return out;
}

/**
 * Polyphase Interpolator (L = 4)
 */
export function polyphaseInterpolator(
  input: Complex[],
  interpFactor: number = 4,
  taps: Float64Array = KAISER_16_TAPS
): Complex[] {
  const numTaps = taps.length;
  const numBranches = interpFactor;
  const tapsPerBranch = Math.floor(numTaps / numBranches);
  const outLength = input.length * interpFactor;
  const out: Complex[] = new Array(outLength);

  // Polyphase branches scaled by L (scipy convention)
  const branches: number[][] = Array.from({ length: numBranches }, () => []);
  for (let k = 0; k < numTaps; k++) {
    branches[k % numBranches].push(taps[k] * interpFactor);
  }

  for (let n = 0; n < outLength; n++) {
    const branchIdx = n % interpFactor;
    const sampleIdx = Math.floor(n / interpFactor);
    const branchTaps = branches[branchIdx];

    let sumRe = 0;
    let sumIm = 0;
    for (let k = 0; k < tapsPerBranch; k++) {
      const inIdx = sampleIdx - k;
      if (inIdx >= 0 && inIdx < input.length) {
        const sample = input[inIdx];
        const tap = branchTaps[k];
        sumRe += sample.re * tap;
        sumIm += sample.im * tap;
      }
    }
    out[n] = { re: sumRe, im: sumIm };
  }

  return out;
}

/**
 * Digital Down-Converter (DDC) — M21
 * Complex NCO at fc = -fs/8 + 16-tap Kaiser LPF + Decim-by-4
 */
export function digitalDownConverter(
  input: Complex[],
  sampleRate: number = 1000000,
  carrierFreq: number = 125000 // -fs/8
): { mixed: Complex[]; filtered: Complex[]; decimated: Complex[] } {
  // 1. Complex NCO Down-conversion (multiply by e^{-j 2 pi fc n / fs})
  const mixed: Complex[] = new Array(input.length);
  for (let n = 0; n < input.length; n++) {
    const phase = -2 * Math.PI * (carrierFreq / sampleRate) * n;
    const lo = cExp(phase);
    mixed[n] = cMul(input[n], lo);
  }

  // 2. Decimate by 4 with 16-tap Kaiser Filter
  const decimated = polyphaseDecimator(mixed, 4, KAISER_16_TAPS);

  return { mixed, filtered: mixed, decimated };
}

/**
 * Digital Up-Converter (DUC) — M22
 * Interpolation by L=4 + 16-tap Kaiser LPF + Complex NCO at fc = +fs/8
 */
export function digitalUpConverter(
  input: Complex[],
  sampleRate: number = 1000000,
  carrierFreq: number = 125000 // +fs/8
): { interpolated: Complex[]; upconverted: Complex[] } {
  // 1. Interpolate by 4 with Kaiser Filter
  const interpolated = polyphaseInterpolator(input, 4, KAISER_16_TAPS);

  // 2. Complex NCO Up-conversion (multiply by e^{+j 2 pi fc n / fs})
  const upconverted: Complex[] = new Array(interpolated.length);
  for (let n = 0; n < interpolated.length; n++) {
    const phase = 2 * Math.PI * (carrierFreq / sampleRate) * n;
    const lo = cExp(phase);
    upconverted[n] = cMul(interpolated[n], lo);
  }

  return { interpolated, upconverted };
}
