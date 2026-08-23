import { Complex } from '../types';
import { KAISER_64_TAPS } from './fir';
import { cAdd, cMul, cExp } from './complex';

/**
 * 8-Channel Polyphase Analysis Channelizer (M23)
 * Harris 2004 / Vaidyanathan 1993:
 * Input commutator (M=8) -> 8-path polyphase FIR (K=8 taps/branch) -> 8-point DFT
 */
export function polyphaseChannelizer8(
  input: Complex[],
  prototypeTaps: Float64Array = KAISER_64_TAPS
): Complex[][] {
  const M = 8;
  const K = 8; // 64 / 8 = 8 taps per branch
  const numBlocks = Math.floor(input.length / M);
  const channels: Complex[][] = Array.from({ length: M }, () => new Array(numBlocks));

  // Branch filter coefficients: branch p has taps h[k*M + p]
  const branchTaps: number[][] = Array.from({ length: M }, () => new Array(K));
  for (let p = 0; p < M; p++) {
    for (let k = 0; k < K; k++) {
      branchTaps[p][k] = prototypeTaps[k * M + p];
    }
  }

  // Branch delay lines
  const delayLines: Complex[][] = Array.from({ length: M }, () =>
    new Array(K).fill(0).map(() => ({ re: 0, im: 0 }))
  );

  for (let blk = 0; blk < numBlocks; blk++) {
    // 1. Commutator: distribute M input samples to M branches
    const branchOutputs: Complex[] = new Array(M);
    for (let p = 0; p < M; p++) {
      const sample = input[blk * M + p];
      // Shift delay line
      for (let k = K - 1; k > 0; k--) {
        delayLines[p][k] = delayLines[p][k - 1];
      }
      delayLines[p][0] = sample;

      // Filter branch
      let sumRe = 0;
      let sumIm = 0;
      for (let k = 0; k < K; k++) {
        const tap = branchTaps[p][k];
        const s = delayLines[p][k];
        sumRe += s.re * tap;
        sumIm += s.im * tap;
      }
      branchOutputs[p] = { re: sumRe, im: sumIm };
    }

    // 2. 8-point DFT across the branch outputs
    for (let k = 0; k < M; k++) {
      let dftRe = 0;
      let dftIm = 0;
      for (let n = 0; n < M; n++) {
        const angle = (-2 * Math.PI * k * n) / M;
        const twiddle = cExp(angle);
        const term = cMul(branchOutputs[n], twiddle);
        dftRe += term.re;
        dftIm += term.im;
      }
      channels[k][blk] = { re: dftRe, im: dftIm };
    }
  }

  return channels;
}
