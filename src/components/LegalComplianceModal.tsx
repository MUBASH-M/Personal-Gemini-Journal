import React, { useState } from 'react';
import { FileText, Shield, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface LegalComplianceModalProps {
  onDeleteAccount: () => Promise<void>;
  userEmail: string;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  onDeleteAccount,
  userEmail,
}) => {
  const [activeSection, setActiveSection] = useState<'tos' | 'privacy' | 'dpia' | 'licensing'>('tos');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="pb-6 border-b border-[#1A1A1A]/15">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 mb-1">
          Document Set 08 • Regulatory Ledger
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
          Legal, Privacy & Ethical Governance<span className="text-[#8C271E]">.</span>
        </h1>
        <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1">
          Formal disclosures, architectural guarantees, and regulatory terms for the Personal Gemini Journal
        </p>
      </div>

      {/* Navigation tabs for legal docs */}
      <div className="flex flex-wrap gap-2 border-b border-[#1A1A1A]/15 pb-3">
        <button
          onClick={() => setActiveSection('tos')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
            activeSection === 'tos'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs'
              : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
          }`}
        >
          1. Terms of Service
        </button>
        <button
          onClick={() => setActiveSection('privacy')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
            activeSection === 'privacy'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs'
              : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
          }`}
        >
          2. Privacy Policy
        </button>
        <button
          onClick={() => setActiveSection('dpia')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
            activeSection === 'dpia'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs'
              : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
          }`}
        >
          3. DPIA Assessment
        </button>
        <button
          onClick={() => setActiveSection('licensing')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border ${
            activeSection === 'licensing'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-2xs'
              : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
          }`}
        >
          4. Infrastructure Licenses
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white border border-[#1A1A1A]/15 p-6 sm:p-8 shadow-2xs text-[#1A1A1A] text-sm leading-relaxed space-y-6">
        {activeSection === 'tos' && (
          <div className="space-y-6">
            <h2 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-[0.2em] border-b border-[#1A1A1A]/10 pb-2">
              1. Terms of Service (v1.0)
            </h2>

            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/70">1.1 Acceptance of Terms</h3>
              <p className="text-xs font-editorial text-[14px] text-[#1A1A1A]/80 leading-relaxed">
                By registering an account or initiating dialogue with the Personal Gemini Journal (&ldquo;the Service&rdquo;), you formally assent to these Terms of Service. If you do not accept these provisions in their entirety, you must refrain from accessing the platform.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/70">1.2 Scope and Methodology</h3>
              <p className="text-xs font-editorial text-[14px] text-[#1A1A1A]/80 leading-relaxed">
                The Service provides an introspective, AI-assisted reflective environment leveraging the Gemini model family. It generates dynamic prompts, synthesized journal records, and personal emotional trends strictly isolated to your individual account.
              </p>
            </div>

            <div className="p-4 bg-[#F2EFE9] border-l-2 border-[#8C271E] border-y border-r border-[#1A1A1A]/10 text-xs text-[#1A1A1A] space-y-1">
              <div className="font-bold flex items-center text-[#8C271E] uppercase tracking-wider text-[11px]">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                1.3 Explicit Non-Clinical Disclaimer
              </div>
              <p className="font-editorial text-[13px] leading-relaxed text-[#1A1A1A]/90">
                This Service does not constitute medical, psychological, or psychiatric consultation. It is not licensed for diagnostic or clinical therapy. If you or someone you know is undergoing an acute mental health distress or crisis, please contact qualified emergency response teams or certified hotlines immediately.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/70">1.4 Participant Obligations</h3>
              <ul className="list-disc pl-5 text-xs font-editorial text-[14px] text-[#1A1A1A]/80 space-y-1">
                <li>Maintain strict confidentiality over personal credentials and authentication tokens.</li>
                <li>Never attempt to probe, intercept, or circumvent database security rules protecting other accounts.</li>
                <li>Acknowledge full authorship and agency over submitted text and self-reflection prompts.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/70">1.5 Uncompromised Data Ownership</h3>
              <p className="text-xs font-editorial text-[14px] text-[#1A1A1A]/80 leading-relaxed">
                You retain complete, unencumbered ownership of all personal entries, thoughts, and conversations. You preserve the unilateral right to export or expunge your data at will.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="space-y-6">
            <h2 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-[0.2em] border-b border-[#1A1A1A]/10 pb-2">
              2. Privacy Policy & Data Classification (v1.0)
            </h2>

            <div className="overflow-x-auto border border-[#1A1A1A]/10">
              <table className="min-w-full divide-y divide-[#1A1A1A]/10 text-xs">
                <thead className="bg-[#F9F8F6]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Category</th>
                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Examples</th>
                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Strict Usage Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]/10 font-mono text-[11px]">
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold">Account Identity</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Email address, cryptographic UID</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Session authentication & Firestore path partitioning</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold">Dialogue Stream</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Reflective prompts & user messages</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Ephemeral inference with Gemini runtime</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold">Derived Synthesis</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Summaries, emotional sentiment, theme tags</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Populating user-owned private archival index</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/70">2.2 Cryptographic Isolation Guarantees</h3>
              <p className="text-xs font-editorial text-[14px] text-[#1A1A1A]/80 leading-relaxed">
                All saved records reside inside tenant subcollections under <code className="bg-[#F9F8F6] px-1.5 py-0.5 border border-[#1A1A1A]/15 font-mono text-[11px]">/users/{'{uid}'}/entries</code>. Cross-account queries are blocked unconditionally at the database engine level via security rules. The Gemini API secret key is stored exclusively in server environment variables and never reaches client execution runtimes.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/70">2.4 Statutory User Rights</h3>
              <p className="text-xs font-editorial text-[14px] text-[#1A1A1A]/80 leading-relaxed">
                In compliance with GDPR Article 17, CCPA, and modern privacy standards, you maintain the irrevocable right to access, export, or permanently erase your journal ledger.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'dpia' && (
          <div className="space-y-6">
            <h2 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-[0.2em] border-b border-[#1A1A1A]/10 pb-2">
              3. Data Protection Impact Assessment (DPIA)
            </h2>
            <p className="text-xs font-editorial text-[14px] text-[#1A1A1A]/70 italic">
              Formal assessment analyzing processing vectors for reflective content transmitted via cloud-hosted language models.
            </p>

            <div className="overflow-x-auto border border-[#1A1A1A]/10">
              <table className="min-w-full divide-y divide-[#1A1A1A]/10 text-xs">
                <thead className="bg-[#F9F8F6]">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Risk Vector</th>
                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Residual Likelihood</th>
                    <th className="px-3.5 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Architectural Safeguard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]/10 font-mono text-[11px]">
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold">Cross-tenant inspection</td>
                    <td className="px-3.5 py-2.5 text-emerald-800 font-bold">Negligible</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Firestore rules: request.auth.uid == userId match enforced</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold">Prompt identifier leak</td>
                    <td className="px-3.5 py-2.5 text-emerald-800 font-bold">Negligible</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">Zero account metadata or credentials transmitted in prompt body</td>
                  </tr>
                  <tr>
                    <td className="px-3.5 py-2.5 font-bold">Credential exfiltration</td>
                    <td className="px-3.5 py-2.5 text-emerald-800 font-bold">Negligible</td>
                    <td className="px-3.5 py-2.5 text-[#1A1A1A]/70">API keys safeguarded in server runtime; zero browser leakage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'licensing' && (
          <div className="space-y-6">
            <h2 className="text-base font-serif font-bold text-[#1A1A1A] uppercase tracking-[0.2em] border-b border-[#1A1A1A]/10 pb-2">
              4. Infrastructure & Platform Disclosures
            </h2>
            <div className="space-y-3">
              <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6]">
                <span className="font-serif font-bold text-sm text-[#1A1A1A] block">Google AI Studio & Gemini API</span>
                <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                  Operated under Google Cloud and Google AI Studio Terms of Service. Model inference is strictly stateless and handled via authenticated server proxy routes.
                </p>
              </div>
              <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6]">
                <span className="font-serif font-bold text-sm text-[#1A1A1A] block">Firebase Authentication & Cloud Firestore</span>
                <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                  Enterprise-grade data persistence adhering strictly to Google Cloud platform confidentiality certifications.
                </p>
              </div>
              <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6]">
                <span className="font-serif font-bold text-sm text-[#1A1A1A] block">Secret Management & Isolation</span>
                <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                  Zero-exposure secret handling separating frontend presentation from backend API authorization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Deletion / Data Erasure Control (GDPR Article 17) */}
        <div className="mt-8 pt-6 border-t border-[#1A1A1A]/15">
          <div className="border border-[#8C271E]/30 bg-[#F9F8F6] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C271E] mb-0.5 flex items-center">
                <Trash2 className="w-3.5 h-3.5 mr-1 text-[#8C271E]" />
                Right of Erasure • GDPR Article 17
              </div>
              <h3 className="text-sm font-serif font-bold text-[#1A1A1A]">
                Permanent Account & Vault Purge
              </h3>
              <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 max-w-lg">
                Permanently expunge user identity (<code className="font-mono font-bold text-[#1A1A1A]">{userEmail}</code>) and destroy all encrypted subcollections from Cloud Firestore.
              </p>
            </div>

            {confirmDelete ? (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs uppercase tracking-wider font-bold text-[#1A1A1A]/70 hover:text-[#1A1A1A] border border-[#1A1A1A]/20"
                >
                  Cancel
                </button>
                <button
                  id="execute-account-purge-btn"
                  onClick={async () => {
                    setIsDeleting(true);
                    await onDeleteAccount();
                  }}
                  disabled={isDeleting}
                  className="px-4 py-1.5 text-xs uppercase tracking-[0.2em] font-bold bg-[#8C271E] text-white border border-[#8C271E] hover:bg-[#6E1F18] shadow-2xs"
                >
                  {isDeleting ? 'Purging...' : 'Confirm Purge'}
                </button>
              </div>
            ) : (
              <button
                id="initiate-account-purge-btn"
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 text-xs uppercase tracking-[0.15em] font-bold text-[#8C271E] bg-white border border-[#8C271E]/40 hover:bg-[#8C271E] hover:text-white transition-colors shrink-0 shadow-2xs"
              >
                Execute Account Purge
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
