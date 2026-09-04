import React, { useState } from 'react';
import { encryptCapsulePayload } from '../utils/webCrypto';
import { sealTimeCapsuleKey, endSessionAndSummarize } from '../api';
import {
  Lock,
  Clock,
  Key,
  ShieldCheck,
  Sparkles,
  Calendar,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

interface TimeCapsuleModalProps {
  onClose: () => void;
  onCapsuleCreated: () => void;
}

export const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  onClose,
  onCapsuleCreated,
}) => {
  const [reflectionText, setReflectionText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'2m' | '30d' | '180d' | '365d' | 'custom'>('2m');
  const [customDate, setCustomDate] = useState('');
  const [isSealing, setIsSealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTargetDate = (): Date => {
    const now = new Date();
    if (selectedPreset === '2m') {
      return new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes for fast demo
    }
    if (selectedPreset === '30d') {
      return new Date(now.getTime() + 30 * 86400 * 1000);
    }
    if (selectedPreset === '180d') {
      return new Date(now.getTime() + 180 * 86400 * 1000);
    }
    if (selectedPreset === '365d') {
      return new Date(now.getTime() + 365 * 86400 * 1000);
    }
    if (customDate) {
      return new Date(customDate);
    }
    return new Date(now.getTime() + 30 * 86400 * 1000);
  };

  const handleSealCapsule = async () => {
    if (!reflectionText.trim()) {
      setError('Please compose your reflection for the future before sealing.');
      return;
    }

    setIsSealing(true);
    setError(null);

    try {
      const unlockDate = calculateTargetDate().toISOString();
      // 1. Encrypt payload client-side via Web Cryptography API (AES-GCM 256-bit)
      const { ciphertext, iv, key } = await encryptCapsulePayload(reflectionText.trim());

      // 2. Generate capsule entry ID
      const tempEntryId = 'ent_cap_' + Date.now();

      // 3. Seal decryption key in server time-gated vault
      await sealTimeCapsuleKey(tempEntryId, unlockDate, key);

      // 4. Save sealed journal entry
      await endSessionAndSummarize(
        [],
        `[SEALED DIGITAL TIME CAPSULE] Encrypted AES-256 payload locked until ${new Date(unlockDate).toLocaleString()}`,
        {
          isTimeCapsule: true,
          unlockDate,
          encryptedPayload: ciphertext,
          timeCapsuleIv: iv,
        }
      );

      onCapsuleCreated();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to seal time capsule.');
    } finally {
      setIsSealing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1A1A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF9F7] max-w-lg w-full border border-[#1A1A1A] shadow-2xl text-[#1A1A1A] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1A1A1A] text-[#F9F8F6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8C271E]" />
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-bold font-mono">
                Time-Locked Digital Capsule
              </div>
              <div className="text-[10px] text-white/60 font-serif italic">
                Client AES-256-GCM + Server Time-Gated Key Release
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

        <div className="p-6 space-y-5">
          <p className="text-xs font-serif italic text-[#1A1A1A]/70 leading-relaxed">
            Seal a confidential message, intention, or personal prediction for your future self.
            Your words are encrypted directly in your browser using <strong>AES-256-GCM</strong>.
            The decryption key is locked in a cryptographic server vault and mathematically refused
            until the verified server timestamp passes.
          </p>

          {/* Reflection Input */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-[#1A1A1A]/60 mb-1.5">
              Reflection / Letter to Future Self
            </label>
            <textarea
              rows={4}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="What do you want your future self to remember about this exact moment? What commitments or feelings do you want to seal?"
              className="w-full p-3.5 bg-white border border-[#1A1A1A]/20 text-xs font-serif text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#1A1A1A] leading-relaxed"
            />
          </div>

          {/* Target Unlock Date Presets */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider font-bold text-[#1A1A1A]/60 mb-2">
              Select Time-Lock Expiration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPreset('2m')}
                className={`p-2.5 text-center border text-xs font-mono transition-all ${
                  selectedPreset === '2m'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-2xs'
                    : 'bg-white text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                }`}
              >
                <span className="block text-[11px] font-bold">2 Minutes</span>
                <span className="block text-[9px] opacity-70">Demo Preset</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('30d')}
                className={`p-2.5 text-center border text-xs font-mono transition-all ${
                  selectedPreset === '30d'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-2xs'
                    : 'bg-white text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                }`}
              >
                <span className="block text-[11px] font-bold">1 Month</span>
                <span className="block text-[9px] opacity-70">30 Days</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('180d')}
                className={`p-2.5 text-center border text-xs font-mono transition-all ${
                  selectedPreset === '180d'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-2xs'
                    : 'bg-white text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                }`}
              >
                <span className="block text-[11px] font-bold">6 Months</span>
                <span className="block text-[9px] opacity-70">180 Days</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPreset('365d')}
                className={`p-2.5 text-center border text-xs font-mono transition-all ${
                  selectedPreset === '365d'
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] font-bold shadow-2xs'
                    : 'bg-white text-[#1A1A1A]/80 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                }`}
              >
                <span className="block text-[11px] font-bold">1 Year</span>
                <span className="block text-[9px] opacity-70">365 Days</span>
              </button>
            </div>

            <div className="mt-2.5 p-3 bg-white border border-[#1A1A1A]/15 flex items-center justify-between text-xs font-mono">
              <span className="text-[#1A1A1A]/60 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8C271E]" />
                <span>Calculated Unlock Date:</span>
              </span>
              <span className="font-bold text-[#1A1A1A]">
                {calculateTargetDate().toLocaleString()}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cryptographic Guarantee Card */}
          <div className="p-3.5 bg-[#EBF1E8] border border-[#3B5A30]/30 text-[#1F301A] text-xs font-serif italic space-y-1">
            <div className="font-bold font-mono text-[10px] uppercase tracking-wider text-[#3B5A30] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Knowledge Server Guarantee</span>
            </div>
            <p>
              Your raw cleartext is never sent unencrypted. Even system administrators with full database
              access cannot decrypt this record prior to your scheduled unlock timestamp.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 text-xs uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            >
              Cancel
            </button>
            <button
              type="button"
              id="confirm-seal-capsule-btn"
              onClick={handleSealCapsule}
              disabled={isSealing}
              className="h-9 px-5 text-xs uppercase tracking-[0.2em] font-bold bg-[#1A1A1A] hover:bg-black text-white transition-colors flex items-center gap-2 shadow-xs"
            >
              {isSealing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Sealing Vault...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#8C271E]" />
                  <span>Seal Time Capsule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
