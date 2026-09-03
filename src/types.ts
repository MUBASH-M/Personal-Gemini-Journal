export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
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
  messages?: ChatMessage[];
}

export interface InsightsData {
  empty: boolean;
  totalEntries: number;
  totalTurns: number;
  averageTurns: number;
  dominantMood: string;
  reflectionStreakDays: number;
  moodDistribution: Record<string, number>;
  themeFrequency: Array<{ theme: string; count: number }>;
  timeline: Array<{
    sessionIndex: number;
    date: string;
    mood: string;
    moodScore: number;
    turns: number;
    primaryTheme: string;
  }>;
  growthObservation: string;
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

export interface SecurityPosture {
  secretManager: {
    status: string;
    provider: string;
    secretId: string;
    iamRole: string;
    storageLocation: string;
  };
  databaseIsolation: {
    model: string;
    defaultPolicy: string;
    ruleEnforcement: string;
  };
  constitutionCompliant: boolean;
  threatModel: {
    stride: Array<{ threat: string; mitigation: string }>;
  };
  auditLogs: SecurityAuditLog[];
}
