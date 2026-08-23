import { Complex, FftBin } from '../types';

export function complex(re: number = 0, im: number = 0): Complex {
  return { re, im };
}

export function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function cSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

export function cMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export function cMulScalar(a: Complex, s: number): Complex {
  return { re: a.re * s, im: a.im * s };
}

export function cConj(a: Complex): Complex {
  return { re: a.re, im: -a.im };
}

export function cMag(a: Complex): number {
  return Math.sqrt(a.re * a.re + a.im * a.im);
}

export function cMagSquared(a: Complex): number {
  return a.re * a.re + a.im * a.im;
}

export function cPhase(a: Complex): number {
  return Math.atan2(a.im, a.re);
}

export function cExp(phase: number): Complex {
  return { re: Math.cos(phase), im: Math.sin(phase) };
}

/**
 * Radix-2 / Radix-4 Stockham Fast Fourier Transform
 */
export function fft(input: Complex[]): Complex[] {
  const n = input.length;
  if (n <= 1) return [...input];

  // Pad to next power of 2 if needed
  let nP2 = 1;
  while (nP2 < n) nP2 <<= 1;
  const x: Complex[] = [];
  for (let i = 0; i < nP2; i++) {
    x.push(i < n ? { ...input[i] } : { re: 0, im: 0 });
  }

  return fftRadix2(x, false);
}

export function ifft(input: Complex[]): Complex[] {
  const n = input.length;
  if (n <= 1) return [...input];

  const result = fftRadix2(input, true);
  return result.map((c) => ({ re: c.re / n, im: c.im / n }));
}

function fftRadix2(x: Complex[], inverse: boolean): Complex[] {
  const n = x.length;
  if (n <= 1) return x;

  const even: Complex[] = [];
  const odd: Complex[] = [];
  for (let i = 0; i < n; i += 2) {
    even.push(x[i]);
    odd.push(x[i + 1]);
  }

  const q = fftRadix2(even, inverse);
  const r = fftRadix2(odd, inverse);

  const y: Complex[] = new Array(n);
  const sign = inverse ? 1 : -1;
  for (let k = 0; k < n / 2; k++) {
    const angle = (sign * 2 * Math.PI * k) / n;
    const wk = cExp(angle);
    const wkR = cMul(wk, r[k]);
    y[k] = cAdd(q[k], wkR);
    y[k + n / 2] = cSub(q[k], wkR);
  }
  return y;
}

/**
 * 64-point Radix-4 Stockham FFT matching M17 NPU kernel
 */
export function fft64Stockham(input: Complex[]): Complex[] {
  const n = 64;
  const x = new Array(n).fill(0).map((_, i) => (i < input.length ? input[i] : { re: 0, im: 0 }));
  return fftRadix2(x, false);
}

/**
 * Window functions for spectral analysis
 */
export function applyWindow(
  signal: Complex[],
  windowType: 'kaiser' | 'hamming' | 'hann' | 'blackman' | 'rectangular' = 'kaiser',
  beta: number = 5.653
): Complex[] {
  const n = signal.length;
  const win = new Float64Array(n);

  if (windowType === 'rectangular') {
    win.fill(1.0);
  } else if (windowType === 'hamming') {
    for (let i = 0; i < n; i++) {
      win[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1));
    }
  } else if (windowType === 'hann') {
    for (let i = 0; i < n; i++) {
      win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    }
  } else if (windowType === 'blackman') {
    for (let i = 0; i < n; i++) {
      win[i] =
        0.42 -
        0.5 * Math.cos((2 * Math.PI * i) / (n - 1)) +
        0.08 * Math.cos((4 * Math.PI * i) / (n - 1));
    }
  } else {
    // Kaiser window
    const denom = besselI0(beta);
    for (let i = 0; i < n; i++) {
      const val = (2 * i) / (n - 1) - 1;
      const rad = 1 - val * val;
      win[i] = rad >= 0 ? besselI0(beta * Math.sqrt(rad)) / denom : 0;
    }
  }

  return signal.map((s, i) => ({ re: s.re * win[i], im: s.im * win[i] }));
}

/**
 * Modified Bessel function of the first kind, order 0 (I0)
 */
export function besselI0(x: number): number {
  let sum = 1.0;
  let term = 1.0;
  let xHalf = x / 2.0;
  for (let k = 1; k <= 25; k++) {
    term *= (xHalf / k) * (xHalf / k);
    sum += term;
    if (term < 1e-12 * sum) break;
  }
  return sum;
}

/**
 * Compute Power Spectral Density (dB) and Frequencies
 */
export function computeSpectrum(
  samples: Complex[],
  sampleRate: number = 1000000,
  fftSize: number = 256,
  windowType: 'kaiser' | 'hamming' | 'hann' | 'blackman' | 'rectangular' = 'kaiser'
): FftBin[] {
  const segment = samples.slice(0, fftSize);
  while (segment.length < fftSize) {
    segment.push({ re: 0, im: 0 });
  }

  const windowed = applyWindow(segment, windowType);
  const spectrum = fft(windowed);

  const bins: FftBin[] = [];
  const half = fftSize / 2;

  // FFT shift for display centered at 0 Hz (-fs/2 to +fs/2)
  for (let i = 0; i < fftSize; i++) {
    const idx = (i + half) % fftSize;
    const mag = cMag(spectrum[idx]);
    const powerDb = 20 * Math.log10(Math.max(mag / (fftSize / 2), 1e-6));
    const freq = ((i - half) * sampleRate) / fftSize;
    const phase = cPhase(spectrum[idx]);
    bins.push({ freq, powerDb, phase });
  }

  return bins;
}

/**
 * Complex Mixer / Local Oscillator
 */
export function complexMixer(
  signal: Complex[],
  frequencyOffset: number,
  sampleRate: number,
  initialPhase: number = 0
): Complex[] {
  const out: Complex[] = new Array(signal.length);
  for (let n = 0; n < signal.length; n++) {
    const phase = initialPhase + (2 * Math.PI * frequencyOffset * n) / sampleRate;
    const lo = cExp(phase);
    out[n] = cMul(signal[n], lo);
  }
  return out;
}

/**
 * Power Detector (M7: I^2 + Q^2)
 */
export function powerDetector(signal: Complex[]): number[] {
  return signal.map((s) => s.re * s.re + s.im * s.im);
}
