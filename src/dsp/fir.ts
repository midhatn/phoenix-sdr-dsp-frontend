import { Complex } from '../types';
import { besselI0, cAdd, cMulScalar } from './complex';

/**
 * Generate Kaiser-windowed Low-Pass Filter Taps (FIRWIN)
 */
export function designKaiserLpf(
  numTaps: number,
  cutoffRatio: number, // 0 to 0.5 (cutoff / fs)
  beta: number = 5.653
): Float64Array {
  const taps = new Float64Array(numTaps);
  const m = numTaps - 1;
  const i0Beta = besselI0(beta);

  for (let i = 0; i < numTaps; i++) {
    const n = i - m / 2.0;
    let sinc = 0.0;
    if (Math.abs(n) < 1e-9) {
      sinc = 2 * cutoffRatio;
    } else {
      sinc = Math.sin(2 * Math.PI * cutoffRatio * n) / (Math.PI * n);
    }

    const kaiserVal = (2 * i) / m - 1;
    const rad = 1 - kaiserVal * kaiserVal;
    const win = rad >= 0 ? besselI0(beta * Math.sqrt(rad)) / i0Beta : 0;

    taps[i] = sinc * win;
  }

  // Normalize sum to 1.0 (DC gain = 0 dB)
  let sum = 0;
  for (let i = 0; i < numTaps; i++) sum += taps[i];
  if (Math.abs(sum) > 1e-9) {
    for (let i = 0; i < numTaps; i++) taps[i] /= sum;
  }

  return taps;
}

/**
 * 16-tap Kaiser Prototype Filter used across M20, M21, M22
 */
export const KAISER_16_TAPS = designKaiserLpf(16, 0.125, 5.653);

/**
 * 64-tap Kaiser Prototype Filter used in M23 Polyphase Channelizer
 */
export const KAISER_64_TAPS = designKaiserLpf(64, 1.0 / 16.0, 5.653);

/**
 * Direct-Form Real FIR Filter
 */
export function firFilterReal(input: number[], taps: Float64Array | number[]): number[] {
  const numTaps = taps.length;
  const out = new Array<number>(input.length);
  const delayLine = new Float64Array(numTaps);

  for (let i = 0; i < input.length; i++) {
    // Shift delay line
    for (let k = numTaps - 1; k > 0; k--) {
      delayLine[k] = delayLine[k - 1];
    }
    delayLine[0] = input[i];

    // Compute dot product
    let acc = 0;
    for (let k = 0; k < numTaps; k++) {
      acc += delayLine[k] * taps[k];
    }
    out[i] = acc;
  }

  return out;
}

/**
 * 8-Tap Complex FIR Filter (M19)
 */
export function firFilterComplex(
  input: Complex[],
  tapsReal: Float64Array | number[],
  tapsImag?: Float64Array | number[]
): Complex[] {
  const numTaps = tapsReal.length;
  const out: Complex[] = new Array(input.length);
  const delayLine: Complex[] = new Array(numTaps).fill(0).map(() => ({ re: 0, im: 0 }));

  for (let i = 0; i < input.length; i++) {
    // Shift delay line
    for (let k = numTaps - 1; k > 0; k--) {
      delayLine[k] = delayLine[k - 1];
    }
    delayLine[0] = input[i];

    // Dot product
    let accRe = 0;
    let accIm = 0;
    for (let k = 0; k < numTaps; k++) {
      const hRe = tapsReal[k];
      const hIm = tapsImag ? tapsImag[k] : 0;
      const x = delayLine[k];

      accRe += x.re * hRe - x.im * hIm;
      accIm += x.re * hIm + x.im * hRe;
    }
    out[i] = { re: accRe, im: accIm };
  }

  return out;
}
