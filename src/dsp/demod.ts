import { Complex, ConstellationPoint } from '../types';
import { cMul, cExp } from './complex';

/**
 * Sign function matching NPU bit extraction
 */
function sgn(x: number): number {
  return x >= 0 ? 1 : -1;
}

/**
 * Costas Loop & Gardner TED Receiver for BPSK (ORDER=2) and QPSK (ORDER=4) — M25
 */
export function pskReceiver(
  input: Complex[],
  order: 2 | 4 = 4,
  loopBandwidth: number = 0.05,
  damping: number = 0.707
): {
  symbols: Complex[];
  phaseErrors: number[];
  freqOffsetEstimate: number[];
  recoveredConstellation: ConstellationPoint[];
} {
  const numSamples = input.length;
  const symbols: Complex[] = [];
  const phaseErrors: number[] = [];
  const freqOffsetEstimate: number[] = [];
  const recoveredConstellation: ConstellationPoint[] = [];

  // PI Loop Filter gains
  const theta = loopBandwidth / (damping + 1 / (4 * damping));
  const d = 1 + 2 * damping * theta + theta * theta;
  const alpha = (4 * damping * theta) / d;
  const beta = (4 * theta * theta) / d;

  let ncoPhase = 0;
  let ncoFreq = 0;

  for (let n = 0; n < numSamples; n++) {
    // 1. Derotate with NCO
    const derot = cExp(-ncoPhase);
    const z = cMul(input[n], derot);

    // 2. Phase Error Detector (Costas)
    let err = 0;
    if (order === 2) {
      // BPSK: e = Q * sgn(I)
      err = z.im * sgn(z.re);
    } else {
      // QPSK: e = Q * sgn(I) - I * sgn(Q)
      err = z.im * sgn(z.re) - z.re * sgn(z.im);
    }

    // Clip error for stability
    err = Math.max(-1.5, Math.min(1.5, err));

    // 3. Loop Filter (PI Controller)
    ncoFreq += beta * err;
    ncoPhase += ncoFreq + alpha * err;

    // Wrap phase to [-pi, pi]
    while (ncoPhase > Math.PI) ncoPhase -= 2 * Math.PI;
    while (ncoPhase < -Math.PI) ncoPhase += 2 * Math.PI;

    symbols.push(z);
    phaseErrors.push(err);
    freqOffsetEstimate.push(ncoFreq);

    // Map to ideal constellation point
    let idealI = 0;
    let idealQ = 0;
    let symStr = '';

    if (order === 2) {
      idealI = sgn(z.re);
      idealQ = 0;
      symStr = idealI > 0 ? '1' : '0';
    } else {
      idealI = sgn(z.re) * 0.7071;
      idealQ = sgn(z.im) * 0.7071;
      symStr = `${idealI > 0 ? '1' : '0'}${idealQ > 0 ? '1' : '0'}`;
    }

    const errMag = Math.sqrt((z.re - idealI) ** 2 + (z.im - idealQ) ** 2);
    recoveredConstellation.push({
      i: z.re,
      q: z.im,
      idealI,
      idealQ,
      symbol: symStr,
      errorMag: errMag,
    });
  }

  return { symbols, phaseErrors, freqOffsetEstimate, recoveredConstellation };
}

/**
 * 16-QAM and 64-QAM Decision Slicer and EVM Measurement — M26
 */
export function qamDemodulator(
  input: Complex[],
  order: 16 | 64 = 16
): {
  sliced: Complex[];
  points: ConstellationPoint[];
  evmRmsPercent: number;
  evmPeakPercent: number;
  snrEstimateDb: number;
} {
  const points: ConstellationPoint[] = [];
  const sliced: Complex[] = [];

  let levels: number[] = [];
  let norm = 1.0;

  if (order === 16) {
    // 16-QAM grid: {-3, -1, 1, 3} / sqrt(10)
    norm = 1.0 / Math.sqrt(10);
    levels = [-3 * norm, -1 * norm, 1 * norm, 3 * norm];
  } else {
    // 64-QAM grid: {-7, -5, -3, -1, 1, 3, 5, 7} / sqrt(42)
    norm = 1.0 / Math.sqrt(42);
    levels = [-7 * norm, -5 * norm, -3 * norm, -1 * norm, 1 * norm, 3 * norm, 5 * norm, 7 * norm];
  }

  const slice1D = (val: number): number => {
    let closest = levels[0];
    let minDist = Math.abs(val - closest);
    for (let k = 1; k < levels.length; k++) {
      const dist = Math.abs(val - levels[k]);
      if (dist < minDist) {
        minDist = dist;
        closest = levels[k];
      }
    }
    return closest;
  };

  let sumErrSq = 0;
  let maxErrSq = 0;
  let sumRefPwr = 0;

  for (let n = 0; n < input.length; n++) {
    const sample = input[n];
    const idealI = slice1D(sample.re);
    const idealQ = slice1D(sample.im);

    const errI = sample.re - idealI;
    const errQ = sample.im - idealQ;
    const errSq = errI * errI + errQ * errQ;
    const refPwr = idealI * idealI + idealQ * idealQ;

    sumErrSq += errSq;
    if (errSq > maxErrSq) maxErrSq = errSq;
    sumRefPwr += refPwr;

    const sym = `${idealI >= 0 ? '+' : '-'}${idealQ >= 0 ? '+' : '-'}`;
    const pt: ConstellationPoint = {
      i: sample.re,
      q: sample.im,
      idealI,
      idealQ,
      symbol: sym,
      errorMag: Math.sqrt(errSq),
    };
    points.push(pt);
    sliced.push({ re: idealI, im: idealQ });
  }

  const evmRms = Math.sqrt(sumErrSq / Math.max(1, sumRefPwr));
  const evmPeak = Math.sqrt(maxErrSq / Math.max(1, sumRefPwr / input.length));
  const evmRmsPercent = evmRms * 100;
  const evmPeakPercent = evmPeak * 100;
  const snrEstimateDb = evmRms > 0 ? -20 * Math.log10(evmRms) : 50;

  return {
    sliced,
    points,
    evmRmsPercent,
    evmPeakPercent,
    snrEstimateDb,
  };
}
