import React from 'react';
import { JournalEntry } from '../types';
import { ShieldCheck, ShieldAlert, Key, Hash, Clock, CheckCircle2, X } from 'lucide-react';
import { formatDate } from '../utils/theme';

interface ReceiptModalProps {
  entry: JournalEntry;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ entry, onClose }) => {
  const receipt = entry.receipt;
  const isTampered = receipt?.dataIntegrity === 'TAMPER_DETECTED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] max-w-lg w-full border border-[#1A1A1A] shadow-2xl text-[#1A1A1A] animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#1A1A1A] text-[#F9F8F6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#8C271E]" />
            <span className="text-xs uppercase tracking-[0.2em] font-bold font-mono">
              Cryptographic Entry Receipt • Block #{entry.sequenceIndex || 1}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Verification Status Banner */}
          <div
            className={`p-4 border flex items-start gap-3 ${
              isTampered
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-[#EBF1E8] border-[#3B5A30]/30 text-[#1F301A]'
            }`}
          >
            {isTampered ? (
              <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-[#3B5A30] shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                {isTampered ? 'Tamper Detected: Hash Mismatch' : 'Mathematical Integrity Verified'}
              </div>
              <p className="text-xs mt-1 font-serif italic leading-relaxed">
                {isTampered
                  ? 'The canonical payload digest does not match the recorded SHA-256 seal. This block has been modified after sealing.'
                  : 'This entry is cryptographically chained to its predecessor in your immutable personal ledger. Any modification invalidates the SHA-256 digest.'}
              </p>
            </div>
          </div>

          {/* Cryptographic Fields */}
          <div className="space-y-3 bg-white p-4 border border-[#1A1A1A]/15 font-mono text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 block mb-0.5">
                Block SHA-256 Hash Digest
              </span>
              <div className="bg-[#FAF9F7] p-2 border border-[#1A1A1A]/10 text-[11px] text-[#8C271E] font-bold break-all select-all">
                {entry.hash || '0000000000000000000000000000000000000000000000000000000000000000'}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 block mb-0.5">
                Chained Previous Hash (Parent Link)
              </span>
              <div className="bg-[#FAF9F7] p-2 border border-[#1A1A1A]/10 text-[11px] text-[#1A1A1A]/70 break-all select-all">
                {entry.prevHash || '0000000000000000000000000000000000000000000000000000000000000000'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#1A1A1A]/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 block">
                  Algorithm
                </span>
                <span className="text-[11px] font-bold text-[#1A1A1A]">SHA-256 (Canonical Digest)</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 block">
                  Sealed Timestamp
                </span>
                <span className="text-[11px] text-[#1A1A1A]">{formatDate(entry.createdAt)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1A1A1A]/10">
              <span className="text-[10px] uppercase font-bold text-[#1A1A1A]/50 block mb-1">
                Canonical Hash Input Schema
              </span>
              <p className="text-[10px] text-[#1A1A1A]/60 break-all font-mono leading-relaxed">
                prevHash::entryId::uid::createdAt::summary::mood::keyTakeaway::turnCount
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[10px] font-mono text-[#1A1A1A]/50 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3B5A30]" />
              <span>Provable Privacy • Zero Buzzword Theater</span>
            </div>
            <button
              onClick={onClose}
              className="h-9 px-5 text-xs uppercase tracking-wider font-bold bg-[#1A1A1A] text-white hover:bg-black transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
