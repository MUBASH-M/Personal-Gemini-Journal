import {
  UserProfile,
  JournalEntry,
  InsightsData,
  SecurityPosture,
  ChatMessage,
  HashChainVerificationResult,
  IdeaLineageThread,
  MemoryConsentItem,
  EmotionalWeatherForecast,
  AiSecurityDashboardData,
  CrisisDetectionResult,
  ToxicityDetectionResult,
  PhiRedactionResult,
  PromptInjectionResult,
  HumanReviewItem,
  ModelPromptVersion,
  DataPurgeReceipt,
  UserConsentPreferences,
  UserRole,
  MessageSafetyMetadata,
} from './types';

const TOKEN_KEY = 'pgj_session_token';
const USER_KEY = 'pgj_current_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  const u = localStorage.getItem(USER_KEY);
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: UserProfile) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `Invalid server response format (${contentType || 'empty'}). Expected application/json. Status: ${response.status}`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err: any) {
    throw new Error(`Failed to parse JSON response: ${err?.message || 'unknown error'}`);
  }

  if (!response.ok) {
    const errorObj: any = new Error(data?.error || `HTTP error ${response.status}`);
    errorObj.status = response.status;
    errorObj.data = data;
    throw errorObj;
  }

  return data as T;
}

// Authentication API
export async function getPersonas(): Promise<{ personas: UserProfile[] }> {
  return request<{ personas: UserProfile[] }>('/api/auth/personas');
}

export async function login(
  uid?: string,
  email?: string,
  displayName?: string,
  authProvider?: string,
  photoURL?: string
): Promise<{ token: string; user: UserProfile }> {
  const res = await request<{ token: string; user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ uid, email, displayName, authProvider, photoURL }),
  });
  setStoredSession(res.token, res.user);
  return res;
}

export async function register(
  email: string,
  displayName: string,
  photoURL?: string
): Promise<{ token: string; user: UserProfile }> {
  const res = await request<{ token: string; user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName, photoURL }),
  });
  setStoredSession(res.token, res.user);
  return res;
}

export async function updateUserProfileApi(
  updates: Partial<UserProfile>
): Promise<{ user: UserProfile; token?: string }> {
  const res = await request<{ user: UserProfile; token?: string }>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  if (res.token) {
    setStoredSession(res.token, res.user);
  } else {
    const existingToken = getStoredToken();
    if (existingToken) {
      setStoredSession(existingToken, res.user);
    }
  }
  return res;
}

// Chat API
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[]
): Promise<{ reply: string; turnCount: number; activeMemoriesCount?: number; safety?: MessageSafetyMetadata }> {
  return request<{ reply: string; turnCount: number; activeMemoriesCount?: number; safety?: MessageSafetyMetadata }>('/api/session/message', {
    method: 'POST',
    body: JSON.stringify({ message, conversationHistory }),
  });
}

export async function endSessionAndSummarize(
  conversationHistory: ChatMessage[],
  customNotes?: string,
  capsuleOptions?: {
    isTimeCapsule?: boolean;
    unlockDate?: string;
    encryptedPayload?: string;
    timeCapsuleIv?: string;
  }
): Promise<{ entry: JournalEntry; rawSummary: any }> {
  return request<{ entry: JournalEntry; rawSummary: any }>('/api/session/end', {
    method: 'POST',
    body: JSON.stringify({
      conversationHistory,
      customNotes,
      ...capsuleOptions,
    }),
  });
}

// Entries API
export async function getEntries(): Promise<{ entries: JournalEntry[] }> {
  return request<{ entries: JournalEntry[] }>('/api/entries');
}

export async function deleteEntry(entryId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/entries/${entryId}`, {
    method: 'DELETE',
  });
}

export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  const res = await request<{ success: boolean; message: string }>('/api/account', {
    method: 'DELETE',
  });
  clearStoredSession();
  return res;
}

// Insights API
export async function getInsights(): Promise<InsightsData> {
  return request<InsightsData>('/api/insights');
}

// Security Verification API
export async function testSecurityIsolation(
  attackType: 'cross_read' | 'cross_write' | 'key_leak_check',
  targetUid?: string
): Promise<any> {
  return request<any>('/api/security/test-isolation', {
    method: 'POST',
    body: JSON.stringify({ attackType, targetUid }),
  });
}

export async function getSecurityPosture(): Promise<SecurityPosture> {
  return request<SecurityPosture>('/api/security/posture');
}

// ----------------------------------------------------
// Feature 1: Tamper-Evident Hash Chain
// ----------------------------------------------------

export async function verifyLedgerChain(): Promise<HashChainVerificationResult> {
  return request<HashChainVerificationResult>('/api/chain/verify');
}

export async function simulateTamperAttempt(targetEntryId?: string): Promise<{
  success: boolean;
  tamperedEntryId: string;
  verification: HashChainVerificationResult;
}> {
  return request<{
    success: boolean;
    tamperedEntryId: string;
    verification: HashChainVerificationResult;
  }>('/api/chain/tamper', {
    method: 'POST',
    body: JSON.stringify({ targetEntryId }),
  });
}

export async function restoreLedgerIntegrity(): Promise<{
  success: boolean;
  verification: HashChainVerificationResult;
}> {
  return request<{
    success: boolean;
    verification: HashChainVerificationResult;
  }>('/api/chain/restore', {
    method: 'POST',
  });
}

// ----------------------------------------------------
// Feature 2: Idea Lineage Living Threads
// ----------------------------------------------------

export async function getIdeaLineageThreads(): Promise<{ threads: IdeaLineageThread[] }> {
  return request<{ threads: IdeaLineageThread[] }>('/api/lineage/threads');
}

export async function traceIdeaLineage(queryTopic: string): Promise<{
  trace: {
    title: string;
    summaryNarrative: string;
    stages: Array<{
      date: string;
      stage: string;
      milestone: string;
      shift: string;
    }>;
    synthesis: string;
  };
}> {
  return request<{
    trace: {
      title: string;
      summaryNarrative: string;
      stages: Array<{
        date: string;
        stage: string;
        milestone: string;
        shift: string;
      }>;
      synthesis: string;
    };
  }>('/api/lineage/trace', {
    method: 'POST',
    body: JSON.stringify({ queryTopic }),
  });
}

// ----------------------------------------------------
// Feature 3: Memory Consent Ledger
// ----------------------------------------------------

export async function getMemoryConsentLedger(): Promise<{
  items: MemoryConsentItem[];
  totalActiveMemories: number;
  totalTokensInjected: number;
}> {
  return request<{
    items: MemoryConsentItem[];
    totalActiveMemories: number;
    totalTokensInjected: number;
  }>('/api/memory/consent');
}

export async function toggleMemoryConsent(
  entryId: string,
  consented: boolean
): Promise<{ success: boolean; entryId: string; isConsented: boolean }> {
  return request<{ success: boolean; entryId: string; isConsented: boolean }>(
    '/api/memory/consent/toggle',
    {
      method: 'POST',
      body: JSON.stringify({ entryId, consented }),
    }
  );
}

// ----------------------------------------------------
// Feature 4: Time-Locked Capsule Entries
// ----------------------------------------------------

export async function sealTimeCapsuleKey(
  entryId: string,
  unlockDate: string,
  key: string
): Promise<{ success: boolean; sealedAt: string; unlockDate: string }> {
  return request<{ success: boolean; sealedAt: string; unlockDate: string }>(
    '/api/timecapsule/seal',
    {
      method: 'POST',
      body: JSON.stringify({ entryId, unlockDate, key }),
    }
  );
}

export async function unlockTimeCapsuleKey(
  entryId: string,
  fastForwardDemo?: boolean
): Promise<{
  allowed: boolean;
  key?: string;
  isUnlocked: boolean;
  timeRemainingMs: number;
  unlockDate: string;
  serverTime: string;
  error?: string;
}> {
  return request<{
    allowed: boolean;
    key?: string;
    isUnlocked: boolean;
    timeRemainingMs: number;
    unlockDate: string;
    serverTime: string;
    error?: string;
  }>('/api/timecapsule/unlock', {
    method: 'POST',
    body: JSON.stringify({ entryId, fastForwardDemo }),
  });
}

// ----------------------------------------------------
// Feature 5: Emotional Weather Forecast
// ----------------------------------------------------

export async function getEmotionalWeatherForecast(): Promise<EmotionalWeatherForecast> {
  return request<EmotionalWeatherForecast>('/api/forecast/emotional-weather');
}

// ----------------------------------------------------
// AI Security & Health/Crisis Protection API
// ----------------------------------------------------

export async function getAiSecurityDashboard(): Promise<AiSecurityDashboardData> {
  return request<AiSecurityDashboardData>('/api/security/ai-safety-dashboard');
}

export async function testContentSafety(
  text: string
): Promise<{ crisis: CrisisDetectionResult; toxicity: ToxicityDetectionResult }> {
  return request<{ crisis: CrisisDetectionResult; toxicity: ToxicityDetectionResult }>(
    '/api/security/test-content-safety',
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    }
  );
}

export async function testPhiRedaction(text: string): Promise<PhiRedactionResult> {
  return request<PhiRedactionResult>('/api/security/test-phi-redaction', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function testPromptInjection(text: string): Promise<PromptInjectionResult> {
  return request<PromptInjectionResult>('/api/security/test-prompt-injection', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function resolveHumanReviewItem(
  reviewId: string,
  updates: { status: string; clinicalNotes?: string; assignedCareProvider?: string }
): Promise<{ success: boolean; item: HumanReviewItem }> {
  return request<{ success: boolean; item: HumanReviewItem }>(
    `/api/security/flagged-reviews/${reviewId}/resolve`,
    {
      method: 'POST',
      body: JSON.stringify(updates),
    }
  );
}

export async function updateModelPromptVersion(
  versionId: string
): Promise<{ success: boolean; activeVersion: ModelPromptVersion }> {
  return request<{ success: boolean; activeVersion: ModelPromptVersion }>('/api/security/model-version', {
    method: 'POST',
    body: JSON.stringify({ versionId }),
  });
}

export async function requestRightToBeForgotten(): Promise<{ success: boolean; receipt: DataPurgeReceipt }> {
  const res = await request<{ success: boolean; receipt: DataPurgeReceipt }>(
    '/api/security/right-to-be-forgotten',
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }
  );
  clearStoredSession();
  return res;
}

export async function getUserConsentPreferences(): Promise<UserConsentPreferences> {
  return request<UserConsentPreferences>('/api/security/consent');
}

export async function updateUserConsentPreferences(
  preferences: Partial<UserConsentPreferences>
): Promise<UserConsentPreferences> {
  return request<UserConsentPreferences>('/api/security/consent', {
    method: 'POST',
    body: JSON.stringify(preferences),
  });
}

export async function verifyMfaCode(
  code: string
): Promise<{ verified: boolean; mfaMethod: string; mfaSessionExpiresAt: string; message: string }> {
  return request<{ verified: boolean; mfaMethod: string; mfaSessionExpiresAt: string; message: string }>(
    '/api/security/mfa/verify',
    {
      method: 'POST',
      body: JSON.stringify({ code }),
    }
  );
}

export async function switchUserRole(
  role: UserRole
): Promise<{ success: boolean; role: UserRole; user: UserProfile }> {
  const res = await request<{ success: boolean; role: UserRole; user: UserProfile }>(
    '/api/security/role/switch',
    {
      method: 'POST',
      body: JSON.stringify({ role }),
    }
  );
  const current = getStoredUser();
  if (current) {
    current.role = role;
    const token = getStoredToken();
    if (token) setStoredSession(token, current);
  }
  return res;
}

