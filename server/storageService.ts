/**
 * Isolated User Storage Service
 * Enforces per-UID scoping, Firestore security simulation, SHA-256 hash chaining,
 * Time-locked key vaults, Memory Consent Ledger, and Idea Lineage storage.
 */
import {
  GENESIS_HASH,
  calculateBlockHash,
  verifyHashChain,
  HashChainVerificationResult,
} from './cryptoChain.ts';

export interface JournalEntryReceipt {
  algorithm: string;
  sequenceIndex: number;
  timestamp: string;
  blockHash: string;
  prevHash: string;
  dataIntegrity: 'VERIFIED_VALID' | 'TAMPER_DETECTED';
}

export interface JournalEntry {
  entryId: string;
  uid: string;
  summary: string;
  mood: string;
  themes: string[];
  keyTakeaway?: string;
  createdAt: string;
  turnCount: number;
  messages?: Array<{ role: 'user' | 'model'; text: string }>;
  // Feature 1: Tamper-Evident Hash Chain
  hash?: string;
  prevHash?: string;
  sequenceIndex?: number;
  receipt?: JournalEntryReceipt;
  // Feature 3: Memory Consent Ledger
  memoryConsent?: boolean;
  extractedMemorySnippet?: string;
  // Feature 4: Time-Locked Capsule
  isTimeCapsule?: boolean;
  unlockDate?: string;
  encryptedPayload?: string;
  timeCapsuleIv?: string;
  isUnlocked?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  callerUid: string;
  resourcePath: string;
  operation: 'READ' | 'WRITE' | 'DELETE' | 'CROSS_ACCOUNT_ATTEMPT' | 'TAMPER_SIMULATION' | 'TIME_LOCK_VERIFICATION';
  status: 'ALLOW' | 'DENY_403' | 'DENY_423_LOCKED';
  ruleMatched: string;
  details: string;
}

export interface IdeaEvolutionStep {
  entryId: string;
  date: string;
  stage: 'Spark / Conception' | 'Iteration & Friction' | 'Pivot & Breakthrough' | 'Current Synthesis';
  insight: string;
  evolutionNote: string;
  mood: string;
}

export interface IdeaLineageThread {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  evolutions: IdeaEvolutionStep[];
  currentStatus: string;
  confidenceScore: number;
}

export interface MemoryConsentItem {
  entryId: string;
  createdAt: string;
  mood: string;
  themes: string[];
  summary: string;
  extractedMemory: string;
  isConsented: boolean;
  tokenEstimate: number;
}

export interface EmotionalWeatherForecast {
  headline: string;
  narrative: string;
  tone: 'gentle-inquiry' | 'rejuvenating' | 'strategic-clarity' | 'grounding';
  suggestedReflectionPrompt: string;
  recentDominantMood: string;
  sampleThemes: string[];
  cadenceBasedOn: number;
  disclaimer: string;
  generatedAt: string;
}

// In-memory isolated storage partitioned by UID: Map<UID, Map<entryId, JournalEntry>>
const userDatabase = new Map<string, Map<string, JournalEntry>>();

// Original pristine backups for tamper simulation restore: Map<UID, Map<entryId, JournalEntry>>
const pristineBackups = new Map<string, Map<string, JournalEntry>>();

// Registered users: Map<UID, UserProfile>
const usersDatabase = new Map<string, UserProfile>();

// Security Audit Log records
const auditLogs: SecurityAuditLog[] = [];

// Time Capsule Secret Key Vault: Map<capsuleEntryId, { key: string; unlockDate: string; uid: string }>
const timeCapsuleVault = new Map<
  string,
  {
    key: string;
    unlockDate: string;
    uid: string;
    sealedAt: string;
  }
>();

export function logAudit(
  callerUid: string,
  resourcePath: string,
  operation: 'READ' | 'WRITE' | 'DELETE' | 'CROSS_ACCOUNT_ATTEMPT' | 'TAMPER_SIMULATION' | 'TIME_LOCK_VERIFICATION',
  status: 'ALLOW' | 'DENY_403' | 'DENY_423_LOCKED',
  ruleMatched: string,
  details: string
) {
  const log: SecurityAuditLog = {
    id: 'sec-' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    callerUid,
    resourcePath,
    operation,
    status,
    ruleMatched,
    details,
  };
  auditLogs.unshift(log);
  if (auditLogs.length > 200) {
    auditLogs.pop();
  }
}

/**
 * Applies cryptographic hash chaining to a list of entries in chronological order.
 */
function chainEntries(entriesChronological: JournalEntry[]): JournalEntry[] {
  let prevHash = GENESIS_HASH;
  const chained: JournalEntry[] = [];

  for (let i = 0; i < entriesChronological.length; i++) {
    const entry = { ...entriesChronological[i] };
    const seq = i + 1;
    entry.sequenceIndex = seq;
    entry.prevHash = prevHash;

    const blockHash = calculateBlockHash(prevHash, entry);
    entry.hash = blockHash;
    entry.receipt = {
      algorithm: 'SHA-256',
      sequenceIndex: seq,
      timestamp: entry.createdAt,
      blockHash,
      prevHash,
      dataIntegrity: 'VERIFIED_VALID',
    };

    chained.push(entry);
    prevHash = blockHash;
  }

  return chained;
}

// Pre-seed Persona Accounts with rich data for all 5 features
function initializeSeedData() {
  const personas: Array<{ profile: UserProfile; entries: JournalEntry[] }> = [
    {
      profile: {
        uid: 'usr_rae_8921',
        email: 'rae@example.com',
        displayName: 'Reflective Rae',
        role: 'Marketing Coordinator',
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      },
      entries: [
        {
          entryId: 'ent_rae_1',
          uid: 'usr_rae_8921',
          summary:
            'Explored mounting anxiety around quarterly stakeholder campaign targets. Processed the feeling of carrying too much alone and identified the need to delegate weekly social scheduling.',
          mood: 'stressed',
          themes: ['workload', 'delegation', 'burnout-prevention'],
          keyTakeaway: 'Delegation is not admitting defeat; it is preserving focus on high-impact strategy.',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          turnCount: 6,
          memoryConsent: true,
          extractedMemorySnippet:
            'Rae experiences anxiety from carrying campaign targets alone; decided to delegate social scheduling.',
        },
        {
          entryId: 'ent_rae_2',
          uid: 'usr_rae_8921',
          summary:
            'Celebrated finishing the cross-department launch presentation ahead of deadline. Felt a palpable sense of accomplishment and calm after a 30-minute evening walk.',
          mood: 'calm',
          themes: ['work-life-balance', 'launch-milestone', 'mindfulness'],
          keyTakeaway: 'Permit yourself to savor wins rather than racing immediately to the next fire.',
          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
          turnCount: 4,
          memoryConsent: true,
          extractedMemorySnippet:
            'Evening walks help Rae decompress after major presentations; values savoring completed milestones.',
        },
        {
          entryId: 'ent_rae_3',
          uid: 'usr_rae_8921',
          summary:
            'Deliberated on setting firm 6:30 PM notification boundaries on work Slack. Articulated how constant pinging interferes with restorative creative reading.',
          mood: 'reflective',
          themes: ['digital-boundaries', 'focus', 'self-care'],
          keyTakeaway: 'Clear communication of availability reduces boundary resentment.',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          turnCount: 5,
          memoryConsent: true,
          extractedMemorySnippet:
            'Rae instituted a firm 6:30 PM Slack shutdown to protect evening creative focus and mental wellbeing.',
        },
        {
          entryId: 'ent_rae_capsule_1',
          uid: 'usr_rae_8921',
          summary:
            '[TIME-LOCKED VAULT RECORD] Sealed personal reflection on 6-month career intentions and personal boundary commitments.',
          mood: 'optimistic',
          themes: ['future-intentions', 'personal-growth', 'time-capsule'],
          keyTakeaway: 'Commitments made to your future self become real when sealed with integrity.',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          turnCount: 3,
          isTimeCapsule: true,
          unlockDate: new Date(Date.now() + 60 * 86400000).toISOString(), // 60 days in future
          encryptedPayload:
            'U2FsdGVkX19Gj8m93V2xL8pZ1Q==" (AES-256-GCM Encrypted: "Dear Rae 6 months from now: Remember how burnt out you felt before setting the 6:30 PM rule. If you are reading this and working late, close your laptop right now. You deserve rest.")',
          timeCapsuleIv: '9a8b7c6d5e4f3a2b1c0d',
          isUnlocked: false,
          memoryConsent: false, // Time capsules excluded from AI memory until opened
          extractedMemorySnippet: '[EXCLUDED: Encrypted Time Capsule payload remains sealed until unlock date]',
        },
      ],
    },
    {
      profile: {
        uid: 'usr_ben_4419',
        email: 'ben@example.com',
        displayName: 'Brainstorm Ben',
        role: 'Indie Product Founder',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      entries: [
        {
          entryId: 'ent_ben_1',
          uid: 'usr_ben_4419',
          summary:
            'Brainstormed monetization models for an open-source analytics toolkit. Outlined tiered self-hosted vs cloud-managed developer subscriptions and API gateway limits.',
          mood: 'excited',
          themes: ['pricing-strategy', 'saas-architecture', 'monetization'],
          keyTakeaway: 'Developer tooling monetization succeeds on frictionless self-service and transparent usage limits.',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          turnCount: 8,
          memoryConsent: true,
          extractedMemorySnippet:
            'Ben is evaluating open-source analytics monetization with tiered self-hosted vs cloud SaaS options.',
        },
        {
          entryId: 'ent_ben_2',
          uid: 'usr_ben_4419',
          summary:
            'Sketched out the onboarding funnel for new trial users. Clarified why asking for credit cards upfront caused a 40% drop-off in user feedback velocity and trial adoption.',
          mood: 'creative',
          themes: ['user-activation', 'ux-friction', 'growth', 'pricing-strategy'],
          keyTakeaway: 'Reduce time-to-value before attempting to extract transaction commitment.',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          turnCount: 6,
          memoryConsent: true,
          extractedMemorySnippet:
            'Discovered 40% bounce rate from upfront credit card requirement; decided to switch to usage-based onboarding.',
        },
        {
          entryId: 'ent_ben_3',
          uid: 'usr_ben_4419',
          summary:
            'Refined the pricing model evolution: Pivoted from rigid seat licenses to a generous free developer tier (100k events/mo) with pay-as-you-scale API limits. Realized pricing is the primary product adoption engine, not a toll booth.',
          mood: 'optimistic',
          themes: ['pricing-strategy', 'developer-growth', 'breakthrough'],
          keyTakeaway: 'Usage-based pricing aligns your business revenue directly with developer customer success.',
          createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          turnCount: 7,
          memoryConsent: true,
          extractedMemorySnippet:
            'Pricing evolution finalized: Generous 100k free tier with transparent pay-as-you-scale billing.',
        },
      ],
    },
    {
      profile: {
        uid: 'usr_priya_7732',
        email: 'priya@example.com',
        displayName: 'Security-Conscious Priya',
        role: 'Engineering Lead & Security Auditor',
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      entries: [
        {
          entryId: 'ent_priya_1',
          uid: 'usr_priya_7732',
          summary:
            'Evaluated zero-trust data access patterns in multi-tenant cloud storage. Tested Firestore security rules validation against path traversal and privilege escalation vectors.',
          mood: 'reflective',
          themes: ['zero-trust', 'threat-modeling', 'security-architecture'],
          keyTakeaway: 'Declarative security rules must enforce structural ownership at the path level.',
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          turnCount: 5,
          memoryConsent: true,
          extractedMemorySnippet:
            'Priya audits cloud storage boundaries; verified path-level Firestore rules against privilege escalation.',
        },
        {
          entryId: 'ent_priya_2',
          uid: 'usr_priya_7732',
          summary:
            'Designed SHA-256 cryptographic receipt verification and tamper-evident audit logs for user journals. Validated that client-side hash chains detect any unauthorized storage alterations.',
          mood: 'calm',
          themes: ['cryptography', 'tamper-evident', 'provable-privacy'],
          keyTakeaway: 'Security claims become trustworthy only when mathematically verifiable by the end user.',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          turnCount: 6,
          memoryConsent: true,
          extractedMemorySnippet:
            'Priya verified tamper-evident SHA-256 hash chaining to provide mathematically provable journal integrity.',
        },
      ],
    },
  ];

  for (const p of personas) {
    usersDatabase.set(p.profile.uid, p.profile);

    // Sort entries chronologically before chaining
    const sorted = [...p.entries].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const chained = chainEntries(sorted);

    const entryMap = new Map<string, JournalEntry>();
    const pristineMap = new Map<string, JournalEntry>();

    for (const e of chained) {
      entryMap.set(e.entryId, { ...e });
      pristineMap.set(e.entryId, { ...e });
    }

    userDatabase.set(p.profile.uid, entryMap);
    pristineBackups.set(p.profile.uid, pristineMap);
  }

  // Pre-seed a time capsule secret key for Rae's sample capsule
  timeCapsuleVault.set('ent_rae_capsule_1', {
    key: 'aes-key-rae-sealed-boundary-commitments-2026',
    unlockDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    uid: 'usr_rae_8921',
    sealedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  });
}

initializeSeedData();

// Access functions enforcing /users/{uid}/... security bounds
export function getUserProfile(uid: string): UserProfile | undefined {
  return usersDatabase.get(uid);
}

export function registerUser(email: string, displayName: string): UserProfile {
  for (const user of usersDatabase.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
  }

  const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    role: 'Standard Member',
    createdAt: new Date().toISOString(),
  };

  usersDatabase.set(uid, profile);
  userDatabase.set(uid, new Map<string, JournalEntry>());
  pristineBackups.set(uid, new Map<string, JournalEntry>());

  logAudit(
    uid,
    `/users/${uid}`,
    'WRITE',
    'ALLOW',
    'match /users/{uid} { allow create: if request.auth.uid == uid }',
    `Registered new authenticated user account ${email}`
  );

  return profile;
}

export function getAllUsers(): UserProfile[] {
  return Array.from(usersDatabase.values());
}

export function getUserEntries(callerUid: string, targetUid?: string): {
  allowed: boolean;
  entries: JournalEntry[];
  error?: string;
} {
  const effectiveTarget = targetUid || callerUid;
  const resourcePath = `/users/${effectiveTarget}/entries`;

  if (callerUid !== effectiveTarget) {
    logAudit(
      callerUid,
      resourcePath,
      'CROSS_ACCOUNT_ATTEMPT',
      'DENY_403',
      'match /users/{uid}/entries/{entryId} { allow read: if request.auth.uid == uid }',
      `Blocked cross-user read attempt: Caller ${callerUid} attempted to read entries belonging to ${effectiveTarget}`
    );
    return {
      allowed: false,
      entries: [],
      error: `Security Rule Violation: request.auth.uid (${callerUid}) does not match resource path uid (${effectiveTarget}). Access denied.`,
    };
  }

  logAudit(
    callerUid,
    resourcePath,
    'READ',
    'ALLOW',
    'match /users/{uid}/entries/{entryId} { allow read: if request.auth.uid == uid }',
    `Authorized retrieval of private entries for verified uid ${callerUid}`
  );

  const entryMap = userDatabase.get(callerUid);
  if (!entryMap) {
    return { allowed: true, entries: [] };
  }

  // Return sorted newest first for UI display
  const list = Array.from(entryMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return { allowed: true, entries: list };
}

export function saveUserEntry(
  callerUid: string,
  entry: Omit<JournalEntry, 'entryId' | 'uid' | 'createdAt'>,
  targetUid?: string
): { allowed: boolean; entry?: JournalEntry; error?: string } {
  const effectiveTarget = targetUid || callerUid;
  const resourcePath = `/users/${effectiveTarget}/entries`;

  if (callerUid !== effectiveTarget) {
    logAudit(
      callerUid,
      resourcePath,
      'CROSS_ACCOUNT_ATTEMPT',
      'DENY_403',
      'match /users/{uid}/entries/{entryId} { allow write: if request.auth.uid == uid }',
      `Blocked cross-user write attempt: Caller ${callerUid} attempted to write an entry into ${effectiveTarget}'s collection`
    );
    return {
      allowed: false,
      error: `Security Rule Violation: request.auth.uid (${callerUid}) does not match target path uid (${effectiveTarget}). Write rejected.`,
    };
  }

  let entryMap = userDatabase.get(callerUid);
  if (!entryMap) {
    entryMap = new Map<string, JournalEntry>();
    userDatabase.set(callerUid, entryMap);
  }

  let pristineMap = pristineBackups.get(callerUid);
  if (!pristineMap) {
    pristineMap = new Map<string, JournalEntry>();
    pristineBackups.set(callerUid, pristineMap);
  }

  // Get chronological list to determine previous hash
  const existingEntriesChronological = Array.from(entryMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const lastEntry = existingEntriesChronological[existingEntriesChronological.length - 1];
  const prevHash = lastEntry ? lastEntry.hash || GENESIS_HASH : GENESIS_HASH;
  const sequenceIndex = existingEntriesChronological.length + 1;

  const entryId = 'ent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const createdAt = new Date().toISOString();

  // Compute block hash chained to previous entry
  const blockHash = calculateBlockHash(prevHash, {
    entryId,
    uid: callerUid,
    createdAt,
    summary: entry.summary,
    mood: entry.mood,
    keyTakeaway: entry.keyTakeaway,
    turnCount: entry.turnCount,
  });

  const receipt: JournalEntryReceipt = {
    algorithm: 'SHA-256',
    sequenceIndex,
    timestamp: createdAt,
    blockHash,
    prevHash,
    dataIntegrity: 'VERIFIED_VALID',
  };

  const fullEntry: JournalEntry = {
    ...entry,
    entryId,
    uid: callerUid,
    createdAt,
    hash: blockHash,
    prevHash,
    sequenceIndex,
    receipt,
    memoryConsent: entry.memoryConsent !== undefined ? entry.memoryConsent : true,
    extractedMemorySnippet:
      entry.extractedMemorySnippet ||
      `${entry.mood.toUpperCase()}: ${entry.summary.substring(0, 100)}... Key takeaway: ${entry.keyTakeaway || 'None'}`,
  };

  entryMap.set(entryId, fullEntry);
  pristineMap.set(entryId, { ...fullEntry });

  logAudit(
    callerUid,
    `/users/${callerUid}/entries/${entryId}`,
    'WRITE',
    'ALLOW',
    'match /users/{uid}/entries/{entryId} { allow write: if request.auth.uid == uid }',
    `Saved new session entry ${entryId} into isolated user partition with SHA-256 Block #${sequenceIndex} receipt`
  );

  return { allowed: true, entry: fullEntry };
}

export function deleteUserEntry(
  callerUid: string,
  entryId: string,
  targetUid?: string
): { allowed: boolean; success: boolean; error?: string } {
  const effectiveTarget = targetUid || callerUid;
  const resourcePath = `/users/${effectiveTarget}/entries/${entryId}`;

  if (callerUid !== effectiveTarget) {
    logAudit(
      callerUid,
      resourcePath,
      'CROSS_ACCOUNT_ATTEMPT',
      'DENY_403',
      'match /users/{uid}/entries/{entryId} { allow delete: if request.auth.uid == uid }',
      `Blocked unauthorized delete attempt: Caller ${callerUid} attempted to delete entry ${entryId} from ${effectiveTarget}`
    );
    return {
      allowed: false,
      success: false,
      error: `Security Rule Violation: Caller ${callerUid} cannot delete resource belonging to ${effectiveTarget}`,
    };
  }

  const entryMap = userDatabase.get(callerUid);
  if (!entryMap || !entryMap.has(entryId)) {
    return { allowed: true, success: false, error: 'Entry not found' };
  }

  entryMap.delete(entryId);
  const pristineMap = pristineBackups.get(callerUid);
  if (pristineMap) {
    pristineMap.delete(entryId);
  }

  // Re-chain remaining entries so chain integrity remains consistent after intentional deletion
  const remaining = Array.from(entryMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const reChained = chainEntries(remaining);
  entryMap.clear();
  if (pristineMap) pristineMap.clear();
  for (const e of reChained) {
    entryMap.set(e.entryId, { ...e });
    if (pristineMap) pristineMap.set(e.entryId, { ...e });
  }

  logAudit(
    callerUid,
    resourcePath,
    'DELETE',
    'ALLOW',
    'match /users/{uid}/entries/{entryId} { allow delete: if request.auth.uid == uid }',
    `Permanently deleted journal entry ${entryId} and re-verified ledger continuity`
  );

  return { allowed: true, success: true };
}

export function deleteUserAccount(callerUid: string): { allowed: boolean; success: boolean } {
  userDatabase.delete(callerUid);
  pristineBackups.delete(callerUid);
  usersDatabase.delete(callerUid);

  logAudit(
    callerUid,
    `/users/${callerUid}`,
    'DELETE',
    'ALLOW',
    'match /users/{uid} { allow delete: if request.auth.uid == uid }',
    `GDPR/CCPA compliant full account deletion executed for user ${callerUid}`
  );

  return { allowed: true, success: true };
}

export function getAuditLogs(): SecurityAuditLog[] {
  return [...auditLogs];
}

// ----------------------------------------------------
// Feature 1: Tamper-Evident Hash Chain Verification & Simulation
// ----------------------------------------------------

export function verifyUserLedger(uid: string): HashChainVerificationResult {
  const entryMap = userDatabase.get(uid);
  if (!entryMap || entryMap.size === 0) {
    return {
      isValid: true,
      totalBlocks: 0,
      verifiedAt: new Date().toISOString(),
      blocks: [],
    };
  }

  const chronological = Array.from(entryMap.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return verifyHashChain(chronological);
}

/**
 * Simulates unauthorized tampering with an entry in storage.
 * Alters content without updating the hash, instantly breaking the cryptographic link.
 */
export function simulateTamperAttempt(
  uid: string,
  targetEntryId?: string
): { success: boolean; tamperedEntryId: string; verification: HashChainVerificationResult } {
  const entryMap = userDatabase.get(uid);
  if (!entryMap || entryMap.size === 0) {
    throw new Error('No entries found for user to simulate tampering.');
  }

  const entries = Array.from(entryMap.values());
  const entry = targetEntryId ? entryMap.get(targetEntryId) || entries[0] : entries[0];

  // Tamper: alter text directly in stored object without updating cryptographic hash
  entry.summary =
    '[UNAUTHORIZED TAMPERING INSERTED] ' +
    entry.summary.replace('Explored', 'Maliciously overwritten without signature');
  entryMap.set(entry.entryId, entry);

  logAudit(
    uid,
    `/users/${uid}/entries/${entry.entryId}`,
    'TAMPER_SIMULATION',
    'ALLOW',
    'audit.tamperDetection { flag: HASH_INTEGRITY_BROKEN }',
    `Simulated data modification on Block #${entry.sequenceIndex} (${entry.entryId}). SHA-256 seal intact while content changed.`
  );

  const verification = verifyUserLedger(uid);
  return {
    success: true,
    tamperedEntryId: entry.entryId,
    verification,
  };
}

/**
 * Restores the user's ledger to its uncorrupted original state.
 */
export function restoreLedgerIntegrity(uid: string): {
  success: boolean;
  verification: HashChainVerificationResult;
} {
  const pristineMap = pristineBackups.get(uid);
  if (!pristineMap) {
    throw new Error('No backup available to restore.');
  }

  const entryMap = new Map<string, JournalEntry>();
  for (const [id, e] of pristineMap.entries()) {
    entryMap.set(id, { ...e });
  }
  userDatabase.set(uid, entryMap);

  logAudit(
    uid,
    `/users/${uid}/entries`,
    'TAMPER_SIMULATION',
    'ALLOW',
    'audit.restoreIntegrity { status: LEDGER_RESTORED }',
    `Restored uncorrupted cryptographic state for user ${uid}. All hashes re-aligned.`
  );

  const verification = verifyUserLedger(uid);
  return {
    success: true,
    verification,
  };
}

// ----------------------------------------------------
// Feature 2: Idea Lineage Living Threads
// ----------------------------------------------------

export function getUserLineageThreads(uid: string): IdeaLineageThread[] {
  // Pre-seed high-value idea lineages mapped to our persona personas
  if (uid === 'usr_ben_4419') {
    return [
      {
        id: 'lin_ben_pricing',
        title: 'Developer SaaS Pricing & Monetization Model',
        subtitle: 'From rigid subscriptions to frictionless usage-based adoption engine',
        category: 'Pricing Strategy',
        confidenceScore: 0.96,
        currentStatus: 'Pivoted to generous 100k free tier + pay-as-you-scale billing',
        evolutions: [
          {
            entryId: 'ent_ben_1',
            date: new Date(Date.now() - 7 * 86400000).toISOString(),
            stage: 'Spark / Conception',
            insight:
              'Explored dual-tier open-source vs hosted cloud monetization. Struggled with API rate limits vs fixed seat subscriptions.',
            evolutionNote:
              'Initial thesis focused on traditional tiered seat billing; worried about developer backlash.',
            mood: 'excited',
          },
          {
            entryId: 'ent_ben_2',
            date: new Date(Date.now() - 4 * 86400000).toISOString(),
            stage: 'Iteration & Friction',
            insight:
              'Identified 40% user drop-off in trial funnel caused by upfront credit card barrier. Realized extraction before value is fatal for developer tools.',
            evolutionNote:
              'Friction point forced a complete rethinking of trial barrier and pricing psychology.',
            mood: 'creative',
          },
          {
            entryId: 'ent_ben_3',
            date: new Date(Date.now() - 1 * 86400000).toISOString(),
            stage: 'Current Synthesis',
            insight:
              'Breakthrough: Pricing is an adoption engine, not an extraction toll. Landed on 100k free monthly events with transparent pay-as-you-scale expansion.',
            evolutionNote:
              'Synthesized alignment between developer customer value and cloud infrastructure revenue.',
            mood: 'optimistic',
          },
        ],
      },
      {
        id: 'lin_ben_funnel',
        title: 'Frictionless Developer Onboarding & Activation',
        subtitle: 'Optimizing time-to-first-API-call from CLI to cloud dashboard',
        category: 'Product Growth',
        confidenceScore: 0.91,
        currentStatus: 'Streamlining zero-friction CLI quickstart',
        evolutions: [
          {
            entryId: 'ent_ben_2',
            date: new Date(Date.now() - 4 * 86400000).toISOString(),
            stage: 'Spark / Conception',
            insight:
              'Documented why users bounced: developers want immediate feedback velocity in their terminal before setting up payment profiles.',
            evolutionNote: 'Clarified friction mechanics in developer journey.',
            mood: 'creative',
          },
          {
            entryId: 'ent_ben_3',
            date: new Date(Date.now() - 1 * 86400000).toISOString(),
            stage: 'Current Synthesis',
            insight:
              'Integrated anonymous developer API tokens allowing 50 instant requests before requiring email registration.',
            evolutionNote: 'Radically collapsed time-to-value for new trial developers.',
            mood: 'optimistic',
          },
        ],
      },
    ];
  }

  if (uid === 'usr_rae_8921') {
    return [
      {
        id: 'lin_rae_delegation',
        title: 'Workload Delegation & Burnout Recovery',
        subtitle: 'Unpacking the psychological barrier between self-reliance and strategic leverage',
        category: 'Personal Leadership',
        confidenceScore: 0.95,
        currentStatus: 'Successfully handed off weekly scheduling; reclaiming strategic focus',
        evolutions: [
          {
            entryId: 'ent_rae_1',
            date: new Date(Date.now() - 5 * 86400000).toISOString(),
            stage: 'Spark / Conception',
            insight:
              'Overwhelmed by quarterly stakeholder demands; realized carrying all operational tasks alone caused acute anxiety.',
            evolutionNote: 'Acknowledged that attempting to handle everything solo is unsustainable.',
            mood: 'stressed',
          },
          {
            entryId: 'ent_rae_2',
            date: new Date(Date.now() - 3 * 86400000).toISOString(),
            stage: 'Iteration & Friction',
            insight:
              'Celebrated finishing cross-department presentation; noticed the restorative power of a 30-minute evening walk.',
            evolutionNote: 'Felt the physical contrast between chronic urgency and deliberate pause.',
            mood: 'calm',
          },
          {
            entryId: 'ent_rae_3',
            date: new Date(Date.now() - 1 * 86400000).toISOString(),
            stage: 'Current Synthesis',
            insight:
              'Firm 6:30 PM notification shutdown enacted. Clear communication of availability prevented boundary resentment.',
            evolutionNote: 'Turned the realization of delegation into an active, protective digital ritual.',
            mood: 'reflective',
          },
        ],
      },
    ];
  }

  // Default or dynamic fallback for other users: generate from existing entries
  const entryMap = userDatabase.get(uid);
  const entries = entryMap ? Array.from(entryMap.values()) : [];
  if (entries.length === 0) return [];

  return [
    {
      id: 'lin_dyn_1',
      title: 'Reflective Exploration & Daily Alignment',
      subtitle: 'Tracking personal themes and evolving self-awareness across sessions',
      category: 'Self-Reflection',
      confidenceScore: 0.88,
      currentStatus: 'Active longitudinal thread',
      evolutions: entries.slice(0, 3).map((e, idx) => ({
        entryId: e.entryId,
        date: e.createdAt,
        stage: idx === 0 ? 'Spark / Conception' : idx === 1 ? 'Iteration & Friction' : 'Current Synthesis',
        insight: e.summary,
        evolutionNote: e.keyTakeaway || 'Deepened awareness through dialogue.',
        mood: e.mood,
      })),
    },
  ];
}

// ----------------------------------------------------
// Feature 3: Memory Consent Ledger Management
// ----------------------------------------------------

export function getMemoryConsentLedger(uid: string): {
  items: MemoryConsentItem[];
  totalActiveMemories: number;
  totalTokensInjected: number;
} {
  const entryMap = userDatabase.get(uid);
  if (!entryMap) {
    return { items: [], totalActiveMemories: 0, totalTokensInjected: 0 };
  }

  const entries = Array.from(entryMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const items: MemoryConsentItem[] = entries.map((e) => {
    const memory =
      e.extractedMemorySnippet ||
      `${e.mood.toUpperCase()}: ${e.summary.substring(0, 120)}... Key takeaway: ${e.keyTakeaway || 'None'}`;
    const tokenEst = Math.ceil(memory.length / 4);
    return {
      entryId: e.entryId,
      createdAt: e.createdAt,
      mood: e.mood,
      themes: e.themes,
      summary: e.summary,
      extractedMemory: memory,
      isConsented: e.memoryConsent !== false, // default true
      tokenEstimate: tokenEst,
    };
  });

  const consentedItems = items.filter((i) => i.isConsented);
  const totalTokensInjected = consentedItems.reduce((acc, i) => acc + i.tokenEstimate, 0);

  return {
    items,
    totalActiveMemories: consentedItems.length,
    totalTokensInjected,
  };
}

export function toggleEntryMemoryConsent(
  uid: string,
  entryId: string,
  consented: boolean
): { success: boolean; entryId: string; isConsented: boolean } {
  const entryMap = userDatabase.get(uid);
  if (!entryMap || !entryMap.has(entryId)) {
    throw new Error('Entry not found');
  }

  const entry = entryMap.get(entryId)!;
  entry.memoryConsent = consented;
  entryMap.set(entryId, entry);

  logAudit(
    uid,
    `/users/${uid}/memory-consent/${entryId}`,
    'WRITE',
    'ALLOW',
    'userConsentPolicy { action: TOGGLE_AI_MEMORY_PERMISSION }',
    `User ${uid} updated AI Memory Consent for entry ${entryId} to ${consented ? 'PERMITTED' : 'EXCLUDED / FORGOTTEN'}`
  );

  return {
    success: true,
    entryId,
    isConsented: consented,
  };
}

/**
 * Returns strictly the text snippets of entries where the user has consented to AI memory retention.
 */
export function getActiveMemoriesForPrompt(uid: string): string[] {
  const entryMap = userDatabase.get(uid);
  if (!entryMap) return [];

  return Array.from(entryMap.values())
    .filter((e) => e.memoryConsent !== false && !e.isTimeCapsule)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map(
      (e) =>
        `[Session ${new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} | Mood: ${e.mood}]: ${e.extractedMemorySnippet || e.summary}`
    );
}

// ----------------------------------------------------
// Feature 4: Time-Locked Capsule Entries Vault
// ----------------------------------------------------

export function sealTimeCapsuleKey(
  uid: string,
  entryId: string,
  unlockDateIso: string,
  keyString: string
): { success: boolean; sealedAt: string; unlockDate: string } {
  const sealedAt = new Date().toISOString();
  timeCapsuleVault.set(entryId, {
    key: keyString,
    unlockDate: unlockDateIso,
    uid,
    sealedAt,
  });

  logAudit(
    uid,
    `/vault/timecapsules/${entryId}`,
    'WRITE',
    'ALLOW',
    'timeLockVault { policy: ENFORCE_SERVER_TIME_GATE }',
    `Sealed AES cryptographic key for capsule ${entryId} until verified server date ${unlockDateIso}`
  );

  return { success: true, sealedAt, unlockDate: unlockDateIso };
}

export function unlockTimeCapsuleKey(
  callerUid: string,
  entryId: string,
  fastForwardDemo?: boolean
): {
  allowed: boolean;
  key?: string;
  isUnlocked: boolean;
  timeRemainingMs: number;
  unlockDate: string;
  serverTime: string;
  error?: string;
} {
  const vaultItem = timeCapsuleVault.get(entryId);
  const now = Date.now();
  const serverTime = new Date(now).toISOString();

  if (!vaultItem) {
    // If not in vault, check if entry exists and is a time capsule
    return {
      allowed: false,
      isUnlocked: false,
      timeRemainingMs: 0,
      unlockDate: '',
      serverTime,
      error: 'Time Capsule cryptographic record not found in secure vault.',
    };
  }

  if (vaultItem.uid !== callerUid) {
    logAudit(
      callerUid,
      `/vault/timecapsules/${entryId}`,
      'CROSS_ACCOUNT_ATTEMPT',
      'DENY_403',
      'timeLockVault { policy: REQUIRE_OWNER_UID }',
      `Unauthorized attempt to access capsule key ${entryId} by caller ${callerUid}`
    );
    return {
      allowed: false,
      isUnlocked: false,
      timeRemainingMs: 0,
      unlockDate: vaultItem.unlockDate,
      serverTime,
      error: 'Security Rule Violation: Unauthorized vault access.',
    };
  }

  const targetUnlockTime = new Date(vaultItem.unlockDate).getTime();
  const timeRemainingMs = Math.max(0, targetUnlockTime - now);

  // Enforce server-side time lock!
  if (timeRemainingMs > 0 && !fastForwardDemo) {
    logAudit(
      callerUid,
      `/vault/timecapsules/${entryId}`,
      'TIME_LOCK_VERIFICATION',
      'DENY_423_LOCKED',
      'timeLockVault { policy: REJECT_BEFORE_TARGET_TIMESTAMP }',
      `Server rejected key release: Capsule ${entryId} remains locked for ${Math.round(timeRemainingMs / 1000)}s until ${vaultItem.unlockDate}`
    );

    return {
      allowed: false,
      isUnlocked: false,
      timeRemainingMs,
      unlockDate: vaultItem.unlockDate,
      serverTime,
      error: `Capsule is cryptographically time-locked until ${new Date(vaultItem.unlockDate).toLocaleString()}. Server refused decryption key release.`,
    };
  }

  // Key released!
  logAudit(
    callerUid,
    `/vault/timecapsules/${entryId}`,
    'TIME_LOCK_VERIFICATION',
    'ALLOW',
    'timeLockVault { policy: RELEASE_KEY_UPON_TIMESTAMP_PASS }',
    `Verified server timestamp ${serverTime} >= unlock date ${vaultItem.unlockDate}. Decryption key safely released to verified owner.`
  );

  // Update entry state in database
  const entryMap = userDatabase.get(callerUid);
  if (entryMap && entryMap.has(entryId)) {
    const e = entryMap.get(entryId)!;
    e.isUnlocked = true;
    entryMap.set(entryId, e);
  }

  return {
    allowed: true,
    key: vaultItem.key,
    isUnlocked: true,
    timeRemainingMs: 0,
    unlockDate: vaultItem.unlockDate,
    serverTime,
  };
}

// ----------------------------------------------------
// Feature 5: Emotional Weather Forecast Generator
// ----------------------------------------------------

export function getEmotionalWeatherForecast(uid: string): EmotionalWeatherForecast {
  const entryMap = userDatabase.get(uid);
  const entries = entryMap
    ? Array.from(entryMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : [];

  const recent = entries.slice(0, 3);
  const cadenceCount = recent.length;

  if (cadenceCount === 0) {
    return {
      headline: 'Fresh Literary Slate',
      narrative:
        'Your chronicle is ready for its opening entry. Take a quiet breath and unpack whatever thoughts occupy your mind right now.',
      tone: 'grounding',
      suggestedReflectionPrompt: "I'd like to reflect on what's been taking up most of my mental bandwidth lately.",
      recentDominantMood: 'reflective',
      sampleThemes: ['new-beginnings', 'clarity'],
      cadenceBasedOn: 0,
      disclaimer: 'Non-Clinical Conversational Nudge • Generated to spark reflective dialogue',
      generatedAt: new Date().toISOString(),
    };
  }

  // Count mood frequency in recent window
  const moodCounts: Record<string, number> = {};
  recent.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });

  let dominantRecentMood = recent[0].mood;
  let maxC = 0;
  for (const [m, c] of Object.entries(moodCounts)) {
    if (c > maxC) {
      maxC = c;
      dominantRecentMood = m;
    }
  }

  const allRecentThemes = recent.flatMap((e) => e.themes);
  const uniqueThemes = Array.from(new Set(allRecentThemes)).slice(0, 3);

  if (dominantRecentMood === 'stressed' || dominantRecentMood === 'anxious' || dominantRecentMood === 'overwhelmed') {
    return {
      headline: 'Gentle Cadence & Boundary Check-In',
      narrative: `Your recent reflections have carried demanding pressures around ${uniqueThemes.join(', ') || 'work responsibilities'}. As you step into this session, would you like to explore where you can reclaim a moment of quiet space or set firmer boundaries for what is coming up?`,
      tone: 'gentle-inquiry',
      suggestedReflectionPrompt: `I noticed I've been feeling tight and rushed around ${uniqueThemes[0] || 'work'}. Can we talk through setting boundaries before this week gets ahead of me?`,
      recentDominantMood: dominantRecentMood,
      sampleThemes: uniqueThemes,
      cadenceBasedOn: cadenceCount,
      disclaimer: 'Non-Clinical Conversational Nudge • Observed from your last reflections',
      generatedAt: new Date().toISOString(),
    };
  }

  if (dominantRecentMood === 'creative' || dominantRecentMood === 'excited') {
    return {
      headline: 'High-Momentum Spark & Sustainable Focus',
      narrative: `Your recent sessions show an energizing creative surge around ${uniqueThemes.join(', ') || 'new ideas and projects'}. In the midst of this building momentum, do you want to test the foundations or explore how to pace this enthusiasm sustainably?`,
      tone: 'strategic-clarity',
      suggestedReflectionPrompt: `I've had so many ideas around ${uniqueThemes[0] || 'projects'} lately. Help me structure my priorities so I don't scatter my focus.`,
      recentDominantMood: dominantRecentMood,
      sampleThemes: uniqueThemes,
      cadenceBasedOn: cadenceCount,
      disclaimer: 'Non-Clinical Conversational Nudge • Observed from your last reflections',
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    headline: 'Grounded Reflective Cadence',
    narrative: `Your recent entries reflect thoughtful, balanced processing across ${uniqueThemes.join(', ') || 'daily priorities'}. What realization from your recent days feels worth anchoring or carrying forward today?`,
    tone: 'rejuvenating',
    suggestedReflectionPrompt: 'I want to build on a thought from my last reflection and explore what next step feels natural.',
    recentDominantMood: dominantRecentMood,
    sampleThemes: uniqueThemes,
    cadenceBasedOn: cadenceCount,
    disclaimer: 'Non-Clinical Conversational Nudge • Observed from your last reflections',
    generatedAt: new Date().toISOString(),
  };
}
