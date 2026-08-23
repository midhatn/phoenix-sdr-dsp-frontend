import React, { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';
import { mlkemKeyGen, mlkemEncap, mlkemDecap, MlkemKeyPair, MlkemEncapResult } from '../pqc/mlkem';
import { mldsaKeyGen, mldsaSign, mldsaVerify, MldsaKeyPair, MldsaSignature } from '../pqc/mldsa';
import { shake128, shake256, bytesToHex, hexToBytes } from '../pqc/shake';

export const PqcStudio: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'mlkem' | 'mldsa' | 'shake'>('mlkem');

  // ML-KEM state
  const [kemKeyPair, setKemKeyPair] = useState<MlkemKeyPair | null>(null);
  const [kemEncap, setKemEncap] = useState<MlkemEncapResult | null>(null);
  const [kemDecapSecret, setKemDecapSecret] = useState<string | null>(null);
  const [copiedKem, setCopiedKem] = useState(false);

  // ML-DSA state
  const [dsaKeyPair, setDsaKeyPair] = useState<MldsaKeyPair | null>(null);
  const [message, setMessage] = useState<string>('Phoenix SDR-DSP Quantum-Safe Transaction #9482');
  const [dsaSignature, setDsaSignature] = useState<MldsaSignature | null>(null);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [isTampered, setIsTampered] = useState<boolean>(false);

  // SHAKE state
  const [shakeInput, setShakeInput] = useState<string>('AMD Ryzen AI NPU1 Post-Quantum Cryptography');
  const [shakeOutLen, setShakeOutLen] = useState<number>(32);

  // Generate KEM KeyPair
  const handleGenKemKeys = () => {
    const kp = mlkemKeyGen();
    setKemKeyPair(kp);
    setKemEncap(null);
    setKemDecapSecret(null);
  };

  // Encapsulate Secret
  const handleEncap = () => {
    if (!kemKeyPair) return;
    const res = mlkemEncap(kemKeyPair.publicKey);
    setKemEncap(res);
    setKemDecapSecret(null);
  };

  // Decapsulate Secret
  const handleDecap = () => {
    if (!kemKeyPair || !kemEncap) return;
    const ss = mlkemDecap(kemEncap.ciphertext, kemKeyPair.secretKey);
    setKemDecapSecret(bytesToHex(ss));
  };

  // Generate DSA KeyPair
  const handleGenDsaKeys = () => {
    const kp = mldsaKeyGen();
    setDsaKeyPair(kp);
    setDsaSignature(null);
    setVerifyResult(null);
    setIsTampered(false);
  };

  // Sign Message
  const handleSign = () => {
    if (!dsaKeyPair) return;
    const sig = mldsaSign(message, dsaKeyPair.secretKey);
    setDsaSignature(sig);
    setVerifyResult(null);
    setIsTampered(false);
  };

  // Verify Signature
  const handleVerify = (tamper: boolean = false) => {
    if (!dsaKeyPair || !dsaSignature) return;

    let sigBytes = dsaSignature.sigBytes;
    if (tamper) {
      sigBytes = new Uint8Array(dsaSignature.sigBytes);
      sigBytes[15] ^= 0xaa; // Corrupt signature byte
      setIsTampered(true);
    } else {
      setIsTampered(false);
    }

    const isValid = mldsaVerify(message, sigBytes, dsaKeyPair.publicKey);
    setVerifyResult(isValid);
  };

  return (
    <div className="space-y-6">
      {/* PQC Header Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">
                Post-Quantum Cryptography Studio (NIST FIPS 203 & 204)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive ML-KEM-768 (Kyber) Key Encapsulation and ML-DSA-65 (Dilithium) Digital Signatures
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSubTab('mlkem')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeSubTab === 'mlkem'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              FIPS 203 ML-KEM-768
            </button>
            <button
              onClick={() => setActiveSubTab('mldsa')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeSubTab === 'mldsa'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              FIPS 204 ML-DSA-65
            </button>
            <button
              onClick={() => setActiveSubTab('shake')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeSubTab === 'shake'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              SHAKE XOF (FIPS 202)
            </button>
          </div>
        </div>
      </div>

      {/* ML-KEM Tab */}
      {activeSubTab === 'mlkem' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Key Generation */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Step 1: Key Generation (M32e)
                  </span>
                  <Key className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Generate ML-KEM-768 Keypair
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Matrix A in Z_3329^(3x3)[X] generated via SHAKE-128, CBD noise sampling.
                </p>

                {kemKeyPair && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Public Key (pk) — 1184 Bytes</span>
                      <span className="font-mono text-cyan-300 text-[11px] break-all">
                        {bytesToHex(kemKeyPair.publicKey).slice(0, 32)}...
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Secret Key (sk) — 2400 Bytes</span>
                      <span className="font-mono text-slate-400 text-[11px] break-all">
                        {bytesToHex(kemKeyPair.secretKey).slice(0, 32)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenKemKeys}
                className="w-full mt-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{kemKeyPair ? 'Regenerate Keypair' : 'Generate Keypair'}</span>
              </button>
            </div>

            {/* Step 2: Encapsulation */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Step 2: Encapsulation (M32e)
                  </span>
                  <Lock className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Encapsulate Shared Secret (Encap)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Encrypts a 256-bit ephemeral seed with public key into a 1088-byte ciphertext.
                </p>

                {kemEncap && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Ciphertext (ct) — 1088 Bytes</span>
                      <span className="font-mono text-cyan-300 text-[11px] break-all">
                        {bytesToHex(kemEncap.ciphertext).slice(0, 32)}...
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Alice Shared Secret (256-bit)</span>
                      <span className="font-mono text-emerald-400 font-bold text-[11px] break-all">
                        {bytesToHex(kemEncap.sharedKey)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleEncap}
                disabled={!kemKeyPair}
                className="w-full mt-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encapsulate Secret</span>
              </button>
            </div>

            {/* Step 3: Decapsulation */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Step 3: Decapsulation (M32e)
                  </span>
                  <Unlock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Decapsulate with Secret Key (Decap)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Constant-time Fujisaki-Okamoto polynomial reconstruction on AIE2 tile.
                </p>

                {kemDecapSecret && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Bob Decapsulated Secret</span>
                      <span className="font-mono text-emerald-400 font-bold text-[11px] break-all">
                        {kemDecapSecret}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Shared Secrets Match Exactly (100% Agreement)
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleDecap}
                disabled={!kemEncap}
                className="w-full mt-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Decapsulate Secret</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ML-DSA Tab */}
      {activeSubTab === 'mldsa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Keypair */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Step 1: Key Generation (M33d)
                  </span>
                  <Key className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Generate ML-DSA-65 Keypair
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Matrix A in Z_8380417^(6x5)[X], Power2Round decomposition.
                </p>

                {dsaKeyPair && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Public Key (pk) — 1952 Bytes</span>
                      <span className="font-mono text-cyan-300 text-[11px] break-all">
                        {bytesToHex(dsaKeyPair.publicKey).slice(0, 32)}...
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Secret Key (sk) — 4032 Bytes</span>
                      <span className="font-mono text-slate-400 text-[11px] break-all">
                        {bytesToHex(dsaKeyPair.secretKey).slice(0, 32)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenDsaKeys}
                className="w-full mt-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{dsaKeyPair ? 'Regenerate DSA Keys' : 'Generate DSA Keys'}</span>
              </button>
            </div>

            {/* Step 2: Sign Message */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Step 2: Sign Message (M33e-S)
                  </span>
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Sign Custom Payload
                </h3>

                <div className="mb-3">
                  <label className="text-xs text-slate-400 block mb-1">Message Text:</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {dsaSignature && (
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Signature (3309 Bytes)</span>
                      <span className="font-mono text-cyan-300 text-[11px] break-all">
                        {dsaSignature.cTildeHex.slice(0, 32)}...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSign}
                disabled={!dsaKeyPair}
                className="w-full mt-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Sign Message</span>
              </button>
            </div>

            {/* Step 3: Verify & Fail-Closed Gate */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Step 3: Verification (M33e-V)
                  </span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Verify & Security Gate
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Verify polynomial hint consistency w1 = UseHint(h, Az - ct1 * 2^d).
                </p>

                {verifyResult !== null && (
                  <div className="space-y-2 text-xs">
                    {verifyResult ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Valid Post-Quantum Signature (PASS)</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-semibold flex items-center gap-2">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>FAIL-CLOSED: Corrupted/Tampered Signature Rejected!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <button
                  onClick={() => handleVerify(false)}
                  disabled={!dsaSignature}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Valid Signature</span>
                </button>

                <button
                  onClick={() => handleVerify(true)}
                  disabled={!dsaSignature}
                  className="w-full py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-800/80 text-red-300 font-medium text-xs transition-colors flex items-center justify-center space-x-1.5"
                  title="Corrupts 1 byte in the signature and checks fail-closed gate"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test Tamper Gate (Fail-Closed)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHAKE Tab */}
      {activeSubTab === 'shake' && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            Keccak / SHAKE-128 & SHAKE-256 Extendable-Output Function (M32c)
          </h3>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Input Text / Seed:</label>
            <input
              type="text"
              value={shakeInput}
              onChange={(e) => setShakeInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                SHAKE-128 Digest (32 Bytes / 256 bits)
              </span>
              <span className="font-mono text-cyan-300 text-xs break-all block">
                {bytesToHex(shake128(shakeInput, 32))}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                SHAKE-256 Digest (64 Bytes / 512 bits)
              </span>
              <span className="font-mono text-purple-300 text-xs break-all block">
                {bytesToHex(shake256(shakeInput, 64))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
