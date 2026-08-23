export interface Complex {
  re: number;
  im: number;
}

export type MilestoneCategory =
  | 'DSP_BASIC'
  | 'DSP_FILTERING'
  | 'DSP_MODULATION'
  | 'FINITE_FIELD'
  | 'PQC_KEM'
  | 'PQC_DSA'
  | 'SYSTEM_PERF';

export interface MilestoneTest {
  id: string;
  number: string;
  name: string;
  category: MilestoneCategory;
  description: string;
  hardwareBackend: 'Direct Silicon (AIE2)' | 'NPU/Host Composer' | 'CPU Reference';
  citation: string;
  tolerance: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  maxError?: number;
  durationMs?: number;
  logs?: string[];
  metrics?: Record<string, string | number>;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface SiliconRunStats {
  total: number;
  passed: number;
  failed: number;
  running: boolean;
  totalDurationMs?: number;
  hardwareDirectCount?: number;
  composerCount?: number;
  cpuRefCount?: number;
  throughputMsps?: number;
  lastRunTimestamp?: string;
}

export interface SignalSample {
  time: number;
  i: number;
  q: number;
  magnitude: number;
  phase: number;
}

export interface FftBin {
  freq: number;
  powerDb: number;
  phase: number;
}

export interface ConstellationPoint {
  i: number;
  q: number;
  idealI: number;
  idealQ: number;
  symbol: string;
  errorMag: number;
}

export interface PqcKeyPair {
  scheme: 'ML-KEM-768' | 'ML-DSA-65';
  publicKeyHex: string;
  secretKeyHex: string;
  createdAt: number;
}

export interface PqcCiphertext {
  ciphertextHex: string;
  sharedSecretHex: string;
  encapsulationTimeMs: number;
}

export interface PqcSignature {
  signatureHex: string;
  message: string;
  signTimeMs: number;
  valid?: boolean;
}
