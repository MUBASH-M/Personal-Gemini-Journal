/**
 * Isolated User Storage Service
 * Simulates Firestore security architecture: /users/{uid}/entries/{entryId}
 * Enforces Deny-By-Default per-UID scoping and access auditing.
 */

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
  operation: 'READ' | 'WRITE' | 'DELETE' | 'CROSS_ACCOUNT_ATTEMPT';
  status: 'ALLOW' | 'DENY_403';
  ruleMatched: string;
  details: string;
}

// In-memory isolated storage partitioned by UID: Map<UID, Map<entryId, JournalEntry>>
const userDatabase = new Map<string, Map<string, JournalEntry>>();

// Registered users: Map<UID, UserProfile>
const usersDatabase = new Map<string, UserProfile>();

// Security Audit Log records
const auditLogs: SecurityAuditLog[] = [];

function logAudit(
  callerUid: string,
  resourcePath: string,
  operation: 'READ' | 'WRITE' | 'DELETE' | 'CROSS_ACCOUNT_ATTEMPT',
  status: 'ALLOW' | 'DENY_403',
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

// Pre-seed Persona Accounts
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
          createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
          turnCount: 8,
        },
        {
          entryId: 'ent_ben_2',
          uid: 'usr_ben_4419',
          summary:
            'Sketched out the onboarding funnel for new trial users. Clarified why asking for credit cards upfront caused a 40% drop-off in user feedback velocity.',
          mood: 'creative',
          themes: ['user-activation', 'ux-friction', 'growth'],
          keyTakeaway: 'Reduce time-to-value before attempting to extract transaction commitment.',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          turnCount: 6,
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
        },
      ],
    },
  ];

  for (const p of personas) {
    usersDatabase.set(p.profile.uid, p.profile);
    const entryMap = new Map<string, JournalEntry>();
    for (const e of p.entries) {
      entryMap.set(e.entryId, e);
    }
    userDatabase.set(p.profile.uid, entryMap);
  }
}

initializeSeedData();

// Access functions enforcing /users/{uid}/... security bounds
export function getUserProfile(uid: string): UserProfile | undefined {
  return usersDatabase.get(uid);
}

export function registerUser(email: string, displayName: string): UserProfile {
  // Check if exists by email
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

  // Firestore Security Rule: allow read: if request.auth.uid == uid;
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

  const entryId = 'ent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const fullEntry: JournalEntry = {
    ...entry,
    entryId,
    uid: callerUid,
    createdAt: new Date().toISOString(),
  };

  entryMap.set(entryId, fullEntry);

  logAudit(
    callerUid,
    `/users/${callerUid}/entries/${entryId}`,
    'WRITE',
    'ALLOW',
    'match /users/{uid}/entries/{entryId} { allow write: if request.auth.uid == uid }',
    `Saved new session entry ${entryId} into isolated user partition`
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

  logAudit(
    callerUid,
    resourcePath,
    'DELETE',
    'ALLOW',
    'match /users/{uid}/entries/{entryId} { allow delete: if request.auth.uid == uid }',
    `Permanently deleted journal entry ${entryId}`
  );

  return { allowed: true, success: true };
}

export function deleteUserAccount(callerUid: string): { allowed: boolean; success: boolean } {
  userDatabase.delete(callerUid);
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
