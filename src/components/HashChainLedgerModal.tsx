import React, { useState, useEffect } from 'react';
import { HashChainVerificationResult } from '../types';
import {
  verifyLedgerChain,
  simulateTamperAttempt,
  restoreLedgerIntegrity,
} from '../api';
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  Link as LinkIcon,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

interface HashChainLedgerModalProps {
  onClose: () => void;
  onLedgerUpdated?: () => void;
}

export const HashChainLedgerModal: React.FC<HashChainLedgerModalProps> = ({
  onClose,
  onLedgerUpdated,
}) => {
  const [result, setResult] = useState<HashChainVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const fetchVerification = async () => {
    setLoading(true);
    try {
      const data = await verifyLedgerChain();
      setResult(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, []);

  const handleSimulateTamper = async () => {
    setActionLoading(true);
    setDemoNotice(null);
    try {
      const res = await simulateTamperAttempt();
      setResult(res.verification);
      setDemoNotice(
        `🚨 Tamper simulation active: We modified Block #${res.verification.brokenBlockIndex || 1} in storage without updating its SHA-256 seal. The chain is mathematically severed.`
      );
      if (onLedgerUpdated) onLedgerUpdated();
    } catch (err: any) {
      setDemoNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    setDemoNotice(null);
    try {
      const res = await restoreLedgerIntegrity();
      setResult(res.verification);
      setDemoNotice('✅ Ledger integrity restored to pristine backup state. All blocks re-verified.');
      if (onLedgerUpdated) onLedgerUpdated();
    } catch (err: any) {
      setDemoNotice(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] max-w-2xl w-full border border-[#1A1A1A] shadow-2xl text-[#1A1A1A] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-[#1A1A1A] text-[#F9F8F6] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#8C271E]" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold font-mono">
                Cryptographic Hash Chain Ledger
              </div>
              <div className="text-[10px] text-white/60 font-serif italic">
                Local Tamper-Evident SHA-256 Chained Integrity
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Toolbar */}
        <div className="px-6 py-3 bg-[#F2EFE9] border-b border-[#1A1A1A]/15 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={fetchVerification}
              disabled={loading || actionLoading}
              className="h-8 px-3 text-[11px] uppercase tracking-wider font-bold bg-white hover:bg-[#FAF9F7] border border-[#1A1A1A]/20 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Verify Chain</span>
            </button>

            <button
              id="simulate-tamper-btn"
              onClick={handleSimulateTamper}
              disabled={actionLoading || loading}
              className="h-8 px-3 text-[11px] uppercase tracking-wider font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 transition-colors"
              title="Simulates an attacker or database admin modifying an entry"
            >
              <AlertTriangle className="w-3 h-3 text-rose-700" />
              <span>Simulate Tamper (Demo)</span>
            </button>

            {result && !result.isValid && (
              <button
                id="restore-ledger-btn"
                onClick={handleRestore}
                disabled={actionLoading || loading}
                className="h-8 px-3 text-[11px] uppercase tracking-wider font-bold bg-[#EBF1E8] hover:bg-[#DEE8DA] text-[#1F301A] border border-[#3B5A30]/40 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-[#3B5A30]" />
                <span>Restore Integrity</span>
              </button>
            )}
          </div>

          <div className="text-[10px] font-mono text-[#1A1A1A]/60">
            {result ? `${result.totalBlocks} Blocks Evaluated` : 'Analyzing...'}
          </div>
        </div>

        {/* Demo Notice Banner */}
        {demoNotice && (
          <div className="px-6 py-2.5 bg-[#1A1A1A] text-white text-xs font-mono shrink-0">
            {demoNotice}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Overall Status Banner */}
          {result && (
            <div
              className={`p-4 border flex items-start gap-3.5 ${
                result.isValid
                  ? 'bg-[#EBF1E8] border-[#3B5A30]/30 text-[#1F301A]'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {result.isValid ? (
                <ShieldCheck className="w-6 h-6 text-[#3B5A30] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-700 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-xs font-bold uppercase tracking-wider">
                  {result.isValid
                    ? `Ledger Verified: All ${result.totalBlocks} Blocks Cryptographically Intact`
                    : `Tamper Flagged: Chain Broken at Block #${result.brokenBlockIndex}`}
                </div>
                <p className="text-xs mt-1 font-serif italic leading-relaxed">
                  {result.isValid
                    ? 'Every entry hash strictly matches its content digest and links uninterrupted back to the genesis block. Provable data integrity with zero third-party trust.'
                    : result.reason ||
                      'A disparity was found between calculated digest and recorded hash. The chain continuity is broken.'}
                </p>
              </div>
            </div>
          )}

          {/* Visual Block Chain */}
          <div className="space-y-4">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#1A1A1A]/50 flex items-center gap-1.5">
              <Hash className="w-3 h-3 text-[#1A1A1A]" />
              <span>Block-by-Block Verification Sequence</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs font-serif italic text-[#1A1A1A]/60">
                Evaluating SHA-256 block chain...
              </div>
            ) : !result || !Array.isArray(result.blocks) || result.blocks.length === 0 ? (
              <div className="py-8 text-center text-xs font-serif italic text-[#1A1A1A]/60">
                No blocks recorded yet. Complete a journal session to generate Block #1.
              </div>
            ) : (
              <div className="space-y-3">
                {(result.blocks || []).map((b, idx) => (
                  <div
                    key={b.entryId}
                    className={`p-4 border transition-all ${
                      b.isValid
                        ? 'bg-white border-[#1A1A1A]/20 hover:border-[#1A1A1A]/50'
                        : 'bg-rose-50 border-rose-500 ring-2 ring-rose-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#1A1A1A]/10">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider ${
                            b.isValid
                              ? 'bg-[#1A1A1A] text-white'
                              : 'bg-rose-700 text-white animate-pulse'
                          }`}
                        >
                          Block #{b.sequenceIndex}
                        </span>
                        <span className="text-[11px] font-mono text-[#1A1A1A]/60">
                          {b.entryId}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {b.isValid ? (
                          <span className="text-[#3B5A30] text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Intact
                          </span>
                        ) : (
                          <span className="text-rose-700 text-[11px] flex items-center gap-1 font-mono font-bold">
                            <AlertTriangle className="w-3.5 h-3.5" /> TAMPER DETECTED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-editorial text-[#1A1A1A] italic mb-3">
                      "{b.summaryPreview}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-[#FAF9F7] p-2 border border-[#1A1A1A]/10 truncate">
                        <span className="text-[#1A1A1A]/50 block uppercase font-bold">Recorded Hash</span>
                        <span className={`break-all ${b.isValid ? 'text-[#8C271E]' : 'text-rose-700 font-bold'}`}>
                          {b.hash.substring(0, 24)}...
                        </span>
                      </div>

                      <div className="bg-[#FAF9F7] p-2 border border-[#1A1A1A]/10 truncate">
                        <span className="text-[#1A1A1A]/50 block uppercase font-bold">
                          {b.isValid ? 'Previous Link' : 'Calculated Digest (Mismatch!)'}
                        </span>
                        <span className="break-all text-[#1A1A1A]/70">
                          {b.isValid
                            ? `${b.prevHash.substring(0, 24)}...`
                            : `${b.calculatedHash.substring(0, 24)}...`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-[#1A1A1A]/15 flex items-center justify-between shrink-0">
          <div className="text-[10px] font-serif italic text-[#1A1A1A]/60">
            Provable journal security anchored in mathematical digests, not empty claims.
          </div>
          <button
            onClick={onClose}
            className="h-8 px-4 text-xs uppercase tracking-wider font-bold bg-[#1A1A1A] text-white hover:bg-black transition-colors"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
