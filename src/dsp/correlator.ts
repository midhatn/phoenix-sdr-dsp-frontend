import { Complex } from '../types';

/**
 * Standard Barker-13 sequence: [+1, +1, +1, +1, +1, -1, -1, +1, +1, -1, +1, -1, +1]
 * Reversed Barker-13 taps used in matched FIR: [+1, -1, +1, -1, +1, +1, -1, -1, +1, +1, +1, +1, +1]
 */
export const BARKER_13_SEQ = [1, 1, 1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1];
export const BARKER_13_TAPS = [1, -1, 1, -1, 1, 1, -1, -1, 1, 1, 1, 1, 1];

export interface CorrelationResult {
  correlation: Complex[];
  magnitude: number[];
  peakIndex: number;
  peakValue: number;
  pslDb: number; // Peak-to-Sidelobe Ratio in dB
}

/**
 * Barker-13 Matched-Filter Correlator (M24)
 * Two independent real FIRs on I and Q channels with reversed Barker-13 taps
 */
export function barker13Correlator(input: Complex[]): CorrelationResult {
  const L = 13;
  const outLen = input.length;
  const correlation: Complex[] = new Array(outLen);
  const magnitude: number[] = new Array(outLen);

  const delayLineI = new Float64Array(L);
  const delayLineQ = new Float64Array(L);

  let peakIdx = -1;
  let maxMag = -1;

  for (let i = 0; i < outLen; i++) {
    // Shift delay lines
    for (let k = L - 1; k > 0; k--) {
      delayLineI[k] = delayLineI[k - 1];
      delayLineQ[k] = delayLineQ[k - 1];
    }
    delayLineI[0] = input[i].re;
    delayLineQ[0] = input[i].im;

    // Dot product with Barker-13 taps
    let sumI = 0;
    let sumQ = 0;
    for (let k = 0; k < L; k++) {
      const tap = BARKER_13_TAPS[k];
      sumI += delayLineI[k] * tap;
      sumQ += delayLineQ[k] * tap;
    }

    const mag = Math.sqrt(sumI * sumI + sumQ * sumQ);
    correlation[i] = { re: sumI, im: sumQ };
    magnitude[i] = mag;

    if (mag > maxMag) {
      maxMag = mag;
      peakIdx = i;
    }
  }

  // Calculate Peak-to-Sidelobe Level (PSL)
  let maxSidelobe = 0;
  for (let i = 0; i < outLen; i++) {
    if (Math.abs(i - peakIdx) >= 6) {
      if (magnitude[i] > maxSidelobe) {
        maxSidelobe = magnitude[i];
      }
    }
  }
  const pslDb =
    maxSidelobe > 0 ? 20 * Math.log10(maxMag / maxSidelobe) : 20 * Math.log10(maxMag || 1);

  return {
    correlation,
    magnitude,
    peakIndex: peakIdx,
    peakValue: maxMag,
    pslDb,
  };
}
