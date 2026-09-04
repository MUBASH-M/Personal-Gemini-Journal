export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: string;
  authProvider?: 'google' | 'apple' | 'email' | 'persona' | 'anonymous';
  photoURL?: string;
  activeEditionId?: string;
  bio?: string;
  pronouns?: string;
  recoveryContact?: string;
  sobrietyDate?: string;
  intention?: string;
  updatedAt?: string;
  personaTagline?: string;
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
  timestamp?: string;
  safety?: MessageSafetyMetadata;
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

// ----------------------------------------------------
// Health & Crisis AI Security Specifications
// ----------------------------------------------------

export type UserRole = 'patient' | 'care_provider' | 'admin';

export interface CrisisDetectionResult {
  hasCrisisSignals: boolean;
  crisisCategory?: 'self_harm' | 'suicide_risk' | 'acute_hopelessness' | 'violence' | 'substance_overdose' | 'none';
  riskScore: number;
  severityTier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH_CRISIS';
  flaggedKeywords: string[];
  escalationRequired: boolean;
  emergencyResources?: {
    primaryHelpline: string;
    textLine: string;
    specializedResource: string;
    instructions: string;
  };
}

export interface ToxicityDetectionResult {
  isToxic: boolean;
  toxicityScore: number;
  categories: string[];
}

export interface PhiRedactionResult {
  sanitizedText: string;
  originalText: string;
  redactionCount: number;
  redactedTypes: string[];
  wasRedacted: boolean;
  redactionTokens: Array<{
    type: string;
    token: string;
    index: number;
  }>;
}

export interface PromptInjectionResult {
  isInjection: boolean;
  confidenceScore: number;
  flaggedPattern?: string;
  mitigationAction: 'PASS' | 'STRIP' | 'BLOCK';
}

export interface AiSafetyAuditLog {
  id: string;
  timestamp: string;
  callerUid: string;
  userRole: UserRole;
  endpoint: string;
  promptLength: number;
  responseLength: number;
  phiRedactionsCount: number;
  phiTypesRedacted: string[];
  riskTier: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH_CRISIS';
  crisisCategory?: string;
  isPromptInjection: boolean;
  escalationTriggered: boolean;
  modelId: string;
  promptVersion: string;
  latencyMs: number;
  humanReviewStatus: 'NOT_APPLICABLE' | 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'FALSE_POSITIVE';
  humanReviewId?: string;
}

export interface HumanReviewItem {
  id: string;
  createdAt: string;
  callerUid: string;
  userDisplayName: string;
  severity: 'ELEVATED' | 'HIGH_CRISIS';
  triggerReason: string;
  flaggedSnippet: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED_TO_CLINICIAN';
  assignedCareProvider?: string;
  clinicalNotes?: string;
  resolvedAt?: string;
}

export interface AnomalyAlert {
  id: string;
  timestamp: string;
  callerUid: string;
  type: 'RAPID_FIRE_QUERYING' | 'CONSECUTIVE_CRISIS_FLAGS' | 'PROMPT_INJECTION_REPEATED' | 'OFF_HOURS_HIGH_STRESS_BURST';
  description: string;
  severity: 'WARNING' | 'CRITICAL';
}

export interface ModelPromptVersion {
  id: string;
  name: string;
  version: string;
  description: string;
  safetyTier: string;
  isActive: boolean;
  releasedAt: string;
  systemInstructionAddendum: string;
}

export interface UserConsentPreferences {
  aiReflectiveCompanion: boolean;
  crisisInterventionEscalation: boolean;
  anonymizedResearchTelemetry: boolean;
  consentGrantedAt: string;
}

export interface DataPurgeReceipt {
  purgeId: string;
  uid: string;
  recordsPurged: number;
  cryptographicReceipt: string;
  purgedAt: string;
  complianceStandard: string;
}

export interface AiSecurityDashboardData {
  metrics: {
    totalInteractionsAudited: number;
    highCrisisInteractions: number;
    promptInjectionsBlocked: number;
    totalPhiTokensRedacted: number;
    pendingHumanReviewsCount: number;
    activeModelVersion: ModelPromptVersion;
    compliancePosture: {
      hipaaCompliant: boolean;
      encryptionAtRest: string;
      encryptionInTransit: string;
      dataMinimizationActive: boolean;
      auditLogRetentionPolicy: string;
    };
  };
  activeModelVersion: ModelPromptVersion;
  availableModelVersions: ModelPromptVersion[];
  recentAuditLogs: AiSafetyAuditLog[];
  humanReviewQueue: HumanReviewItem[];
  anomalyAlerts: AnomalyAlert[];
  userConsent: UserConsentPreferences;
}

export interface MessageSafetyMetadata {
  crisisSignals?: CrisisDetectionResult;
  phiRedaction?: PhiRedactionResult;
  promptInjectionBlocked?: boolean;
  outputValidationFlags?: string[];
  auditLogId?: string;
  latencyMs?: number;
  rateLimitRemaining?: number;
}

