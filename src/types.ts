export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  authProvider?: 'google' | 'apple' | 'email' | 'persona' | 'anonymous';
  photoURL?: string;
  activeEditionId?: string;
}

export interface JournalEdition {
  id: string;
  issueNumber: string; // e.g. "Issue No. 04", "Issue No. 05", "Issue No. 06"
  title: string;       // e.g. "Archival Edition", "Living Horizon", "Synthesis & Trajectory"
  subtitle: string;
  type: 'archival' | 'new_edition' | 'special_folio';
  period: string;      // e.g. "2024–2025 Retrospective", "2026 Spring/Summer", "2026 Volume II"
  description: string; // Editorial prologue or curator note
  isNewEdition: boolean;
  entryCount?: number;
  publishedAt?: string;
  isCustom?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

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
  messages?: ChatMessage[];
  // Editorial Edition association
  editionId?: string;
  editionTitle?: string;
  editionIssue?: string;
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

export interface HashChainBlockInfo {
  sequenceIndex: number;
  entryId: string;
  hash: string;
  prevHash: string;
  calculatedHash: string;
  isValid: boolean;
  timestamp: string;
  summaryPreview: string;
  tampered?: boolean;
}

export interface HashChainVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedAt: string;
  brokenBlockIndex?: number;
  reason?: string;
  blocks: HashChainBlockInfo[];
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
