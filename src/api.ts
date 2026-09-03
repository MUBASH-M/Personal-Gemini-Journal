import { UserProfile, JournalEntry, InsightsData, SecurityPosture, ChatMessage } from './types';

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

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

// Authentication API
export async function getPersonas(): Promise<{ personas: UserProfile[] }> {
  return request<{ personas: UserProfile[] }>('/api/auth/personas');
}

export async function login(uid?: string, email?: string): Promise<{ token: string; user: UserProfile }> {
  const res = await request<{ token: string; user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ uid, email }),
  });
  setStoredSession(res.token, res.user);
  return res;
}

export async function register(email: string, displayName: string): Promise<{ token: string; user: UserProfile }> {
  const res = await request<{ token: string; user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, displayName }),
  });
  setStoredSession(res.token, res.user);
  return res;
}

// Chat API
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[]
): Promise<{ reply: string; turnCount: number }> {
  return request<{ reply: string; turnCount: number }>('/api/session/message', {
    method: 'POST',
    body: JSON.stringify({ message, conversationHistory }),
  });
}

export async function endSessionAndSummarize(
  conversationHistory: ChatMessage[],
  customNotes?: string
): Promise<{ entry: JournalEntry; rawSummary: any }> {
  return request<{ entry: JournalEntry; rawSummary: any }>('/api/session/end', {
    method: 'POST',
    body: JSON.stringify({ conversationHistory, customNotes }),
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
