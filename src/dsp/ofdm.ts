import { Complex } from '../types';
import { fft, ifft, cAdd, cMul, cMag } from './complex';

/**
 * 64-Subcarrier OFDM Transceiver Loopback (M27)
 * N_fft = 64, N_cp = 16 (Symbol length = 80 samples)
 * 52 data/pilot subcarriers (IEEE 802.11a/g convention): 48 data + 4 pilots
 */
export const OFDM_NFFT = 64;
export const OFDM_NCP = 16;
export const OFDM_NSYMBOL = OFDM_NFFT + OFDM_NCP;

// Pilot subcarrier indices (-21, -7, +7, +21 -> mapped to 0..63)
export const PILOT_INDICES = [43, 57, 7, 21];
export const PILOT_VALUES = [1, 1, 1, -1];

export interface OfdmTxResult {
  timeDomainSignal: Complex[];
  frequencySymbols: Complex[];
  numSymbols: number;
}

export interface OfdmRxResult {
  recoveredSymbols: Complex[];
  channelEstimate: number[];
  berEstimate: number;
  evmPercent: number;
}

/**
 * OFDM Modulator
 */
export function ofdmModulate(dataSymbols: Complex[]): OfdmTxResult {
  const numDataPerSymbol = 48;
  const numSymbols = Math.ceil(dataSymbols.length / numDataPerSymbol);
  const timeDomainSignal: Complex[] = [];
  const frequencySymbols: Complex[] = [];

  let dataIdx = 0;
  for (let s = 0; s < numSymbols; s++) {
    const grid: Complex[] = new Array(OFDM_NFFT).fill(0).map(() => ({ re: 0, im: 0 }));

    // Map 48 data subcarriers and 4 pilots (subcarriers -26 to -1, +1 to +26, excluding DC index 0)
    for (let k = 1; k <= 26; k++) {
      // Positive frequencies (1..26)
      if (PILOT_INDICES.includes(k)) {
        grid[k] = { re: PILOT_VALUES[PILOT_INDICES.indexOf(k)], im: 0 };
      } else if (dataIdx < dataSymbols.length) {
        grid[k] = dataSymbols[dataIdx++];
      }

      // Negative frequencies (-26..-1 mapped to 38..63)
      const negK = 64 - k;
      if (PILOT_INDICES.includes(negK)) {
        grid[negK] = { re: PILOT_VALUES[PILOT_INDICES.indexOf(negK)], im: 0 };
      } else if (dataIdx < dataSymbols.length) {
        grid[negK] = dataSymbols[dataIdx++];
      }
    }

    frequencySymbols.push(...grid);

    // IFFT to time domain
    const timeBlock = ifft(grid);

    // Add Cyclic Prefix (take last NCP samples and prepend)
    const cp = timeBlock.slice(OFDM_NFFT - OFDM_NCP);
    timeDomainSignal.push(...cp, ...timeBlock);
  }

  return { timeDomainSignal, frequencySymbols, numSymbols };
}

/**
 * OFDM Demodulator & Equalizer
 */
export function ofdmDemodulate(rxSignal: Complex[], numSymbols: number): OfdmRxResult {
  const recoveredSymbols: Complex[] = [];
  const channelEstimate: number[] = new Array(OFDM_NFFT).fill(1.0);

  let totalErrSq = 0;
  let totalRefSq = 0;

  for (let s = 0; s < numSymbols; s++) {
    const blockStart = s * OFDM_NSYMBOL;
    if (blockStart + OFDM_NSYMBOL > rxSignal.length) break;

    // Strip cyclic prefix
    const timeBlock = rxSignal.slice(blockStart + OFDM_NCP, blockStart + OFDM_NSYMBOL);

    // FFT to frequency domain
    const freqBlock = fft(timeBlock);

    // Channel Estimation via Pilots
    let pilotGainSum = 0;
    for (let i = 0; i < PILOT_INDICES.length; i++) {
      const pIdx = PILOT_INDICES[i];
      const pVal = PILOT_VALUES[i];
      const rxVal = freqBlock[pIdx].re;
      pilotGainSum += Math.abs(rxVal / pVal);
    }
    const avgGain = Math.max(0.1, pilotGainSum / PILOT_INDICES.length);

    // Equalize and extract data subcarriers
    for (let k = 1; k <= 26; k++) {
      if (!PILOT_INDICES.includes(k)) {
        const eqSym = { re: freqBlock[k].re / avgGain, im: freqBlock[k].im / avgGain };
        recoveredSymbols.push(eqSym);

        const idealI = Math.sign(eqSym.re || 1) * 0.7071;
        const idealQ = Math.sign(eqSym.im || 1) * 0.7071;
        totalErrSq += (eqSym.re - idealI) ** 2 + (eqSym.im - idealQ) ** 2;
        totalRefSq += idealI * idealI + idealQ * idealQ;
      }

      const negK = 64 - k;
      if (!PILOT_INDICES.includes(negK)) {
        const eqSym = { re: freqBlock[negK].re / avgGain, im: freqBlock[negK].im / avgGain };
        recoveredSymbols.push(eqSym);

        const idealI = Math.sign(eqSym.re || 1) * 0.7071;
        const idealQ = Math.sign(eqSym.im || 1) * 0.7071;
        totalErrSq += (eqSym.re - idealI) ** 2 + (eqSym.im - idealQ) ** 2;
        totalRefSq += idealI * idealI + idealQ * idealQ;
      }
    }
  }

  const evmPercent = Math.sqrt(totalErrSq / Math.max(1, totalRefSq)) * 100;
  const berEstimate = evmPercent > 35 ? 0.05 : evmPercent > 20 ? 0.01 : 0.0;

  return { recoveredSymbols, channelEstimate, berEstimate, evmPercent };
}
