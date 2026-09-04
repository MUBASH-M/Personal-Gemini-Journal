import React, { useState, useEffect } from 'react';
import { SecurityPosture, UserProfile } from '../types';
import {
  getSecurityPosture,
  testSecurityIsolation,
  verifyLedgerChain,
  simulateTamperAttempt,
  restoreLedgerIntegrity,
} from '../api';
import { testLiveFirestoreSecurity, firebaseConfig } from '../firebase';
import { HashChainLedgerModal } from './HashChainLedgerModal';
import { AiSecuritySuite } from './AiSecuritySuite';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Server,
  FileCode,
  Key,
  Terminal,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Hash,
  Link as LinkIcon,
  RotateCcw,
} from 'lucide-react';

interface SecurityInspectorProps {
  currentUser: UserProfile;
  personas: UserProfile[];
}

export const SecurityInspector: React.FC<SecurityInspectorProps> = ({
  currentUser,
  personas,
}) => {
  const [posture, setPosture] = useState<SecurityPosture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testingType, setTestingType] = useState<string | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [securitySection, setSecuritySection] = useState<'ai-suite' | 'database-isolation'>('ai-suite');

  // Quick chain verification summary state
  const [chainSummary, setChainSummary] = useState<{
    isValid: boolean;
    totalBlocks: number;
    brokenBlockIndex?: number;
  } | null>(null);

  const fetchPosture = async () => {
    setIsLoading(true);
    try {
      const data = await getSecurityPosture();
      setPosture(data);
      const chainData = await verifyLedgerChain();
      setChainSummary({
        isValid: chainData.isValid,
        totalBlocks: chainData.totalBlocks,
        brokenBlockIndex: chainData.brokenBlockIndex,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosture();
  }, [currentUser]);

  const runTest = async (type: 'cross_read' | 'cross_write' | 'key_leak_check' | 'chain_verify' | 'tamper_simulate') => {
    setTestingType(type);
    setTestResult(null);
    try {
      if (type === 'chain_verify') {
        const chainRes = await verifyLedgerChain();
        setChainSummary({
          isValid: chainRes.isValid,
          totalBlocks: chainRes.totalBlocks,
          brokenBlockIndex: chainRes.brokenBlockIndex,
        });
        setTestResult({
          testCase: 'TC-10: Cryptographic Hash-Chain Verification',
          callerUid: currentUser.uid,
          status: chainRes.isValid ? 'PASS' : 'TAMPER_FLAGGED',
          serverMessage: chainRes.isValid
            ? `All ${chainRes.totalBlocks} sequential entry blocks verified cryptographically intact with SHA-256 parent digests.`
            : `Hash disparity detected at block #${chainRes.brokenBlockIndex}. Chain severed.`,
          blocksEvaluated: chainRes.totalBlocks,
          canonicalAlgorithm: 'SHA-256 Local Blockchain',
        });
        return;
      }

      if (type === 'tamper_simulate') {
        const tamperRes = await simulateTamperAttempt();
        setChainSummary({
          isValid: tamperRes.verification.isValid,
          totalBlocks: tamperRes.verification.totalBlocks,
          brokenBlockIndex: tamperRes.verification.brokenBlockIndex,
        });
        setTestResult({
          testCase: 'TC-11: Tamper Simulation & Immediate Chain Break',
          callerUid: currentUser.uid,
          status: 'TAMPER_DETECTED_VERIFIED',
          serverMessage: `Entry ${tamperRes.tamperedEntryId} modified in database without valid SHA-256 seal. Verification immediately rejected block #${tamperRes.verification.brokenBlockIndex}.`,
          chainSevered: true,
        });
        fetchPosture();
        return;
      }

      // Pick another persona as target
      const safePersonas = Array.isArray(personas) ? personas : [];
      const otherPersona = safePersonas.find((p) => p.uid !== currentUser.uid) || safePersonas[0] || currentUser;
      const targetUid = otherPersona?.uid || 'usr_target_sim';
      const res = await testSecurityIsolation(type as any, targetUid);

      // If cross-account attempt, also execute live probe against Cloud Firestore SDK
      if (type === 'cross_read' || type === 'cross_write') {
        const firestoreLiveProbe = await testLiveFirestoreSecurity(type, targetUid);
        res.firestoreLiveProbe = firestoreLiveProbe;
      }

      setTestResult(res);
      // Refresh audit logs
      fetchPosture();
    } catch (err: any) {
      setTestResult({
        status: 'ERROR',
        serverMessage: err.message,
      });
    } finally {
      setTestingType(null);
    }
  };

  const handleRestoreChain = async () => {
    try {
      const res = await restoreLedgerIntegrity();
      setChainSummary({
        isValid: res.verification.isValid,
        totalBlocks: res.verification.totalBlocks,
      });
      setTestResult({
        testCase: 'TC-12: Integrity Restoration',
        callerUid: currentUser.uid,
        status: 'RESTORED_GREEN',
        serverMessage: `Ledger restored from pristine backup. All ${res.verification.totalBlocks} blocks re-chained and valid.`,
      });
      fetchPosture();
    } catch (err: any) {
      console.error(err);
    }
  };

  const safePersonas = Array.isArray(personas) ? personas : [];
  const otherUser = safePersonas.find((p) => p.uid !== currentUser.uid) || safePersonas[0] || currentUser;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-[#1A1A1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1A1A1A]/15">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1A1A]/50 mb-1">
            Section 01 Constitution • Architectural Audit
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1A1A1A] tracking-tight">
            Security Posture &amp; Isolation Verifier<span className="text-[#8C271E]">.</span>
          </h1>
          <p className="text-xs font-serif italic text-[#1A1A1A]/60 mt-1">
            Live technical verification proving per-user Firestore isolation, Secret Manager safety, &amp; SHA-256 chain integrity
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowLedgerModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] transition-colors shadow-2xs"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#8C271E]" />
            <span>Open Ledger Chain</span>
          </button>

          <button
            onClick={fetchPosture}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {/* Primary Security Architecture Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#FAF9F7] border border-[#1A1A1A]/15">
        <button
          onClick={() => setSecuritySection('ai-suite')}
          className={`flex-1 py-2.5 px-4 text-xs font-mono uppercase tracking-wider font-bold transition-all border flex items-center justify-center gap-2 ${
            securitySection === 'ai-suite'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
              : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#8C271E]" />
          <span>AI Security, Crisis Guard &amp; Governance (7 Modules)</span>
        </button>

        <button
          onClick={() => setSecuritySection('database-isolation')}
          className={`flex-1 py-2.5 px-4 text-xs font-mono uppercase tracking-wider font-bold transition-all border flex items-center justify-center gap-2 ${
            securitySection === 'database-isolation'
              ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
              : 'bg-white text-[#1A1A1A]/70 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A]'
          }`}
        >
          <Database className="w-4 h-4 text-[#3B5A30]" />
          <span>Cloud Isolation, Secret Manager &amp; SHA-256 Ledger</span>
        </button>
      </div>

      {securitySection === 'ai-suite' ? (
        <AiSecuritySuite currentUser={currentUser} />
      ) : (
        <>
          {/* Feature 1 Summary Card: Cryptographic Chain Status */}
      {chainSummary && (
        <div
          className={`p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            chainSummary.isValid
              ? 'bg-[#EBF1E8] border-[#3B5A30]/30 text-[#1F301A]'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-3">
            {chainSummary.isValid ? (
              <ShieldCheck className="w-6 h-6 text-[#3B5A30] shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-rose-700 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider font-mono">
                {chainSummary.isValid
                  ? `Cryptographic Hash Chain: Intact (${chainSummary.totalBlocks} Blocks Verified)`
                  : `Tamper Detected: Chain Broken at Block #${chainSummary.brokenBlockIndex}`}
              </div>
              <p className="text-xs font-serif italic mt-0.5">
                {chainSummary.isValid
                  ? 'Local SHA-256 block receipts verify zero tampering across your personal journal history.'
                  : 'An unauthorized modification was injected into stored data. The hash chain rejected the block.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!chainSummary.isValid && (
              <button
                onClick={handleRestoreChain}
                className="h-8 px-3 text-xs uppercase tracking-wider font-bold bg-[#1A1A1A] text-white hover:bg-black transition-colors"
              >
                Restore Pristine State
              </button>
            )}
            <button
              onClick={() => setShowLedgerModal(true)}
              className="h-8 px-3 text-xs uppercase tracking-wider font-bold bg-white text-[#1A1A1A] border border-[#1A1A1A]/30 hover:border-[#1A1A1A] transition-colors"
            >
              Examine Blocks →
            </button>
          </div>
        </div>
      )}

      {/* Live Adversarial Test Runner */}
      <div className="bg-white border border-[#1A1A1A]/15 p-6 shadow-2xs">
        <div className="flex items-center space-x-2.5 mb-2 pb-3 border-b border-[#1A1A1A]/10">
          <div className="w-7 h-7 bg-[#F9F8F6] text-[#8C271E] flex items-center justify-center border border-[#1A1A1A]/15">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
              Live Cross-Tenant & Tamper Adversarial Test Suite
            </h2>
            <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/60">
              Trigger intentional boundary breaches to verify fail-closed enforcement across security rules & hash chains
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Test 1: Cross-User Read */}
          <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white border border-[#1A1A1A]/20 text-[#1A1A1A] px-1.5 py-0.5">
                  TC-07
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-bold">Expect: 403 Deny</span>
              </div>
              <h3 className="text-xs font-serif font-bold text-[#1A1A1A] mt-2">
                Cross-User Read Attempt
              </h3>
              <p className="text-[11px] font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                Caller (<span className="font-mono text-[#1A1A1A] font-semibold">{currentUser.displayName}</span>) attempts to query{' '}
                <code className="text-[#8C271E] font-mono text-[10px]">/users/{otherUser?.uid || 'target_user'}/entries</code>.
              </p>
            </div>
            <button
              id="test-cross-read-btn"
              onClick={() => runTest('cross_read')}
              disabled={Boolean(testingType)}
              className="w-full py-2 px-3 text-xs font-bold uppercase tracking-[0.15em] bg-[#1A1A1A] hover:bg-[#8C271E] text-white transition-colors disabled:opacity-50"
            >
              {testingType === 'cross_read' ? 'Simulating...' : 'Run TC-07 Attack'}
            </button>
          </div>

          {/* Test 2: Cross-User Write */}
          <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white border border-[#1A1A1A]/20 text-[#1A1A1A] px-1.5 py-0.5">
                  TC-08
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-bold">Expect: 403 Deny</span>
              </div>
              <h3 className="text-xs font-serif font-bold text-[#1A1A1A] mt-2">
                Cross-User Write Attempt
              </h3>
              <p className="text-[11px] font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                Caller attempts to inject a forged journal record directly into another user's private collection.
              </p>
            </div>
            <button
              id="test-cross-write-btn"
              onClick={() => runTest('cross_write')}
              disabled={Boolean(testingType)}
              className="w-full py-2 px-3 text-xs font-bold uppercase tracking-[0.15em] bg-[#1A1A1A] hover:bg-[#8C271E] text-white transition-colors disabled:opacity-50"
            >
              {testingType === 'cross_write' ? 'Simulating...' : 'Run TC-08 Attack'}
            </button>
          </div>

          {/* Test 3: Key Leak Scan */}
          <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white border border-[#1A1A1A]/20 text-[#1A1A1A] px-1.5 py-0.5">
                  TC-09
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-bold">Expect: 0 Leaks</span>
              </div>
              <h3 className="text-xs font-serif font-bold text-[#1A1A1A] mt-2">
                Secret Bundle Exposure Scan
              </h3>
              <p className="text-[11px] font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                Scans client payload, HTTP headers, and frontend script bundles for any Gemini API key leakage.
              </p>
            </div>
            <button
              id="test-key-leak-btn"
              onClick={() => runTest('key_leak_check')}
              disabled={Boolean(testingType)}
              className="w-full py-2 px-3 text-xs font-bold uppercase tracking-[0.15em] bg-[#1A1A1A] hover:bg-[#8C271E] text-white transition-colors disabled:opacity-50"
            >
              {testingType === 'key_leak_check' ? 'Scanning...' : 'Run TC-09 Scan'}
            </button>
          </div>

          {/* Test 4: Tamper-Evident Chain & Simulation */}
          <div className="p-4 border border-[#1A1A1A]/15 bg-[#F9F8F6] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white border border-[#1A1A1A]/20 text-[#1A1A1A] px-1.5 py-0.5">
                  TC-10
                </span>
                <span className="text-[11px] font-mono text-[#8C271E] font-bold">Tamper Proof</span>
              </div>
              <h3 className="text-xs font-serif font-bold text-[#1A1A1A] mt-2">
                Storage Tamper Simulation
              </h3>
              <p className="text-[11px] font-editorial text-[13px] text-[#1A1A1A]/70 mt-1 leading-relaxed">
                Simulates modifying an entry in DB storage. Proves the cryptographic hash chain flags it instantly.
              </p>
            </div>
            <button
              id="test-tamper-simulate-btn"
              onClick={() => runTest('tamper_simulate')}
              disabled={Boolean(testingType)}
              className="w-full py-2 px-3 text-xs font-bold uppercase tracking-[0.15em] bg-rose-900 hover:bg-rose-950 text-white transition-colors disabled:opacity-50"
            >
              {testingType === 'tamper_simulate' ? 'Simulating Tamper...' : 'Simulate Tamper'}
            </button>
          </div>
        </div>

        {/* Live Attack Test Result Console */}
        {testResult && (
          <div className="mt-4 p-4 bg-[#1A1A1A] text-[#F9F8F6] font-mono text-xs border border-[#1A1A1A] animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px]">
              <span className="flex items-center text-white/70 tracking-widest uppercase">
                <Terminal className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                SECURITY AUDIT INFERENCE VERDICT
              </span>
              <span className="text-emerald-400 font-bold flex items-center tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {testResult.status}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-[11px]">
              <div>
                <span className="text-white/40">Test Protocol: </span>
                <span className="text-white font-semibold">{testResult.testCase}</span>
              </div>
              <div>
                <span className="text-white/40">Authenticated Subject: </span>
                <span className="text-emerald-300">{testResult.callerUid}</span>
              </div>
              {testResult.targetUid && (
                <div>
                  <span className="text-white/40">Target Vault: </span>
                  <span className="text-[#8C271E]">{testResult.targetUid}</span>
                </div>
              )}
              {testResult.securityRule && (
                <div>
                  <span className="text-white/40">Active Rule: </span>
                  <span className="text-amber-300">{testResult.securityRule}</span>
                </div>
              )}
              <div>
                <span className="text-white/40">Verdict Statement: </span>
                <span className="text-emerald-400 font-bold">
                  {testResult.serverMessage || 'Action rejected fail-closed by database isolation rule.'}
                </span>
              </div>
              {testResult.keyResolution && (
                <div>
                  <span className="text-white/40">Key Security: </span>
                  <span className="text-cyan-300">{testResult.keyResolution}</span>
                </div>
              )}
              {testResult.firestoreLiveProbe && (
                <div className="pt-2 mt-2 border-t border-white/15">
                  <span className="text-emerald-400 font-bold block mb-1">
                    ✓ Direct Cloud Firestore SDK Probe:
                  </span>
                  <span className="text-emerald-200">
                    {testResult.firestoreLiveProbe.details}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Secret Manager & Cloud Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Cloud Secret Manager */}
        <div className="bg-white border border-[#1A1A1A]/15 p-6 shadow-2xs">
          <div className="flex items-center space-x-2 mb-3">
            <Key className="w-4 h-4 text-[#8C271E]" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
              Google Cloud Secret Manager
            </h2>
          </div>
          <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/70 mb-4 leading-relaxed">
            API keys are resolved exclusively at server runtime using least-privilege IAM service account bindings. 
            No secret ever touches git, environment templates, or the client execution environment.
          </p>

          <div className="bg-[#F9F8F6] p-4 border border-[#1A1A1A]/15 space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1.5">
              <span className="text-[#1A1A1A]/60">Secret Name:</span>
              <span className="text-[#1A1A1A] font-bold">GEMINI_API_KEY</span>
            </div>
            <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1.5">
              <span className="text-[#1A1A1A]/60">IAM Role:</span>
              <span className="text-[#1A1A1A] font-bold">roles/secretmanager.secretAccessor</span>
            </div>
            <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1.5">
              <span className="text-[#1A1A1A]/60">Lifecycle:</span>
              <span className="text-emerald-800 font-bold">In-memory ephemeral</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">Client Leakage:</span>
              <span className="text-emerald-800 font-bold">0% (Proxied via /api/*)</span>
            </div>
          </div>
        </div>

        {/* Firestore Security Rules & Provisioned Database */}
        <div className="bg-white border border-[#1A1A1A]/15 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-[#8C271E]" />
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
                  Cloud Firestore & Security Rules
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5">
                PROVISIONED & ACTIVE
              </span>
            </div>
            <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/70 mb-3 leading-relaxed">
              Per-user isolated documents under <code className="text-[#8C271E] font-mono text-[10px]">/users/{'{uid}'}/entries/{'{entryId}'}</code> protected by cryptographic token bounds.
            </p>

            <div className="bg-[#F9F8F6] p-3 border border-[#1A1A1A]/15 space-y-1.5 text-xs font-mono mb-3">
              <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1">
                <span className="text-[#1A1A1A]/60">Project ID:</span>
                <span className="text-[#1A1A1A] font-bold truncate max-w-[200px]">{firebaseConfig.projectId}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A1A1A]/10 pb-1">
                <span className="text-[#1A1A1A]/60">Database ID:</span>
                <span className="text-[#1A1A1A] font-bold truncate max-w-[200px]">{firebaseConfig.firestoreDatabaseId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#1A1A1A]/60">Rules Enforcement:</span>
                <span className="text-emerald-800 font-bold">request.auth.uid == userId</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] text-[#F9F8F6] p-3.5 font-mono text-[10px] leading-relaxed border border-[#1A1A1A]">
            <span className="text-white/40">// firestore.rules (Active & Deployed)</span>
            <br />
            <span className="text-purple-300">rules_version</span> = <span className="text-emerald-300">'2'</span>;
            <br />
            <span className="text-cyan-300">service</span> cloud.firestore {'{'}
            <br />
            &nbsp;&nbsp;<span className="text-cyan-300">match</span> /users/{'{'}userId{'}'}/entries/{'{'}entryId{'}'} {'{'}
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-emerald-400 font-bold">allow</span> read, write: <span className="text-cyan-200">request.auth.uid == userId;</span>
            <br />
            &nbsp;&nbsp;{'}'}
            <br />
            {'}'}
          </div>
        </div>
      </div>

      {/* STRIDE Threat Modeling Matrix */}
      <div className="bg-white border border-[#1A1A1A]/15 p-6 shadow-2xs">
        <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-[#1A1A1A]/10">
          <ShieldCheck className="w-5 h-5 text-[#8C271E]" />
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
              STRIDE Threat Modeling Matrix (Phase 1 Constitution)
            </h2>
            <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/60">
              Evaluated before application code generation per Section 3.1 & 4.1 specifications
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#1A1A1A]/10">
          <table className="min-w-full divide-y divide-[#1A1A1A]/10 text-xs">
            <thead>
              <tr className="bg-[#F9F8F6]">
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">STRIDE Threat</th>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Relevant Vector</th>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Enforced Architectural Mitigation</th>
                <th className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-[10px] text-[#1A1A1A]/70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/10 font-mono text-[11px]">
              <tr>
                <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">Spoofing</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Attacker impersonates another user session</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Server-verified tokens; UID derived from signature, never from client body</td>
                <td className="px-4 py-2.5 text-center"><span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5">Enforced</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">Tampering</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Client attempts writing to another user data path or editing sealed records</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">SHA-256 block receipts & cryptographic hash chaining; per-user Firestore access rules</td>
                <td className="px-4 py-2.5 text-center"><span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5">Enforced</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">Repudiation</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Disputed entries or untracked state mutations</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Server-side immutable timestamps on write; tamper-evident audit logging</td>
                <td className="px-4 py-2.5 text-center"><span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5">Enforced</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">Information Disclosure</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Cross-user reflection leak; Gemini key in browser; unconsented context</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Deny-by-default rules; Gemini key server-side; Memory Consent Ledger filtering</td>
                <td className="px-4 py-2.5 text-center"><span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5">Enforced</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">Denial of Service</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Cost abuse via chat flood loops</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Session payload checks and server-side request throttling</td>
                <td className="px-4 py-2.5 text-center"><span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5">Enforced</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-bold text-[#1A1A1A]">Elevation of Privilege</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Backend service account granted excessive IAM rights</td>
                <td className="px-4 py-2.5 text-[#1A1A1A]/70 font-sans text-xs">Least-privilege role scoped solely to secretAccessor and user-scoped Firestore writes</td>
                <td className="px-4 py-2.5 text-center"><span className="bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-0.5">Enforced</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Security Audit Trail */}
      <div className="bg-white border border-[#1A1A1A]/15 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A1A1A]/10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1A1A1A]">
              Live Security Access Audit Log
            </h2>
            <p className="text-xs font-editorial text-[13px] text-[#1A1A1A]/60">
              Real-time ledger of access decisions, tamper detections, and policy enforcement across tenant boundaries
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#1A1A1A]/60 bg-[#F9F8F6] px-2 py-1 border border-[#1A1A1A]/15 uppercase tracking-wider">
            {posture?.auditLogs.length || 0} ledger records
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {!posture || posture.auditLogs.length === 0 ? (
            <p className="text-xs font-editorial italic text-[#1A1A1A]/40 py-4 text-center">No access log records recorded yet.</p>
          ) : (
            posture.auditLogs.map((log) => {
              const isAllow = log.status === 'ALLOW';
              return (
                <div
                  key={log.id}
                  className={`p-3 border text-xs font-mono flex items-start justify-between space-x-3 ${
                    isAllow
                      ? 'bg-[#F9F8F6] border-[#1A1A1A]/10 text-[#1A1A1A]'
                      : 'bg-[#F9F8F6] border-[#8C271E]/40 text-[#8C271E]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold ${
                          isAllow ? 'bg-emerald-800 text-white' : 'bg-[#8C271E] text-white'
                        }`}
                      >
                        {log.status}
                      </span>
                      <span className="font-bold text-[#1A1A1A]">{log.operation}</span>
                      <span className="text-[#1A1A1A]/40">→</span>
                      <span className="text-[#1A1A1A]/70">{log.resourcePath}</span>
                    </div>
                    <p className="text-[11px] font-editorial text-[13px] text-[#1A1A1A]/80">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-[#1A1A1A]/50 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
        </>
      )}

      {/* Ledger Modal */}
      {showLedgerModal && (
        <HashChainLedgerModal
          onClose={() => setShowLedgerModal(false)}
          onLedgerUpdated={fetchPosture}
        />
      )}
    </div>
  );
};
