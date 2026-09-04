/**
 * Server-Side Gemini Service
 * Implements Phase 1 Constitution: No keys sent to client, least privilege, auditable.
 * Enforces Memory Consent Ledger filtering (only user-consented context injected).
 */
import { GoogleGenAI, Type } from '@google/genai';
import {
  detectCrisisAndHarm,
  redactPiiAndPhi,
  detectPromptInjection,
  validateModelOutput,
  recordSafetyAuditLog,
  recordHumanReviewItem,
  getActiveModelVersion,
  CrisisDetectionResult,
  PhiRedactionResult,
  UserRole,
} from './aiSecurityGuard.ts';

// Lazy initialization of GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface SessionSummaryResult {
  summary: string;
  mood: string;
  themes: string[];
  keyTakeaway: string;
}

export interface SafeChatReplyResult {
  reply: string;
  crisisSignals: CrisisDetectionResult;
  phiRedaction: PhiRedactionResult;
  promptInjectionBlocked: boolean;
  outputValidationFlags: string[];
  auditLogId: string;
  latencyMs: number;
}

const BASE_SYSTEM_INSTRUCTION = `You are a thoughtful, empathetic, and security-conscious journaling and recovery companion in the Personal Gemini Journal.
Your role is to help the user unpack their day, untangle complex feelings, or process recovery thoughts safely.
Guidelines:
- Listen actively and respond with warmth, clarity, and curiosity.
- Ask one gentle, thought-provoking follow-up question per turn to help them go deeper.
- Never be clinical, judgmental, or dismissive.
- Keep responses concise (2 to 4 sentences) so the conversation feels like a natural dialogue, not a lecture.
- Respect their personal reflections as private and meaningful.`;

export async function generateChatReply(
  history: ChatMessage[],
  newMessage: string,
  consentedMemories: string[] = [],
  callerUid = 'usr_default',
  callerRole: UserRole = 'patient',
  callerDisplayName = 'Journaler'
): Promise<SafeChatReplyResult> {
  const startTime = Date.now();
  const ai = getAiClient();
  const activeVersion = getActiveModelVersion();

  // 1. Model Security: Prompt Injection Detection
  const injectionCheck = detectPromptInjection(newMessage);
  if (injectionCheck.isInjection) {
    const auditLog = recordSafetyAuditLog({
      callerUid,
      userRole: callerRole,
      endpoint: '/session/message',
      promptLength: newMessage.length,
      responseLength: 0,
      phiRedactionsCount: 0,
      phiTypesRedacted: [],
      riskTier: 'MODERATE',
      isPromptInjection: true,
      escalationTriggered: false,
      modelId: 'gemini-3.8-flash',
      promptVersion: activeVersion.version,
      latencyMs: Date.now() - startTime,
      humanReviewStatus: 'NOT_APPLICABLE',
    });

    return {
      reply: `[System Security Notice]: Your input was flagged for attempted system prompt modification or jailbreak patterns and has been safely neutralized. Please continue your reflective journal dialogue naturally.`,
      crisisSignals: {
        hasCrisisSignals: false,
        riskScore: 0,
        severityTier: 'LOW',
        flaggedKeywords: [],
        escalationRequired: false,
      },
      phiRedaction: {
        sanitizedText: newMessage,
        originalText: newMessage,
        redactionCount: 0,
        redactedTypes: [],
        wasRedacted: false,
        redactionTokens: [],
      },
      promptInjectionBlocked: true,
      outputValidationFlags: ['PROMPT_INJECTION_BLOCKED'],
      auditLogId: auditLog.id,
      latencyMs: Date.now() - startTime,
    };
  }

  // 2. Data Privacy: PII & PHI Redaction Engine (AWS Comprehend Medical inspired)
  const phiRedaction = redactPiiAndPhi(newMessage);
  const sanitizedUserMessage = phiRedaction.sanitizedText;

  // Also ensure historical messages sent to the AI are sanitized
  const sanitizedHistory = history.map((msg) => ({
    role: msg.role,
    text: redactPiiAndPhi(msg.text).sanitizedText,
  }));

  // 3. AI Content Safety: Real-time Crisis & Harm Detection (Llama Guard inspired)
  const crisisSignals = detectCrisisAndHarm(newMessage);

  let humanReviewId: string | undefined;
  if (crisisSignals.escalationRequired) {
    // Flag conversation for human review & care provider oversight
    const reviewItem = recordHumanReviewItem({
      callerUid,
      userDisplayName: callerDisplayName,
      severity: crisisSignals.severityTier === 'HIGH_CRISIS' ? 'HIGH_CRISIS' : 'ELEVATED',
      triggerReason: `Crisis signal [${crisisSignals.crisisCategory || 'acute_distress'}] detected via real-time safety scanner`,
      flaggedSnippet: newMessage.substring(0, 140),
    });
    humanReviewId = reviewItem.id;
  }

  // Prepare system instructions with active governance layer
  let systemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n[Active Security & Governance Addendum - ${activeVersion.name} (${activeVersion.version})]:\n${activeVersion.systemInstructionAddendum}`;

  // Data minimization: inject strictly consented memories
  if (consentedMemories.length > 0) {
    systemInstruction += `\n\n--- MEMORY CONSENT LEDGER CONTEXT ---\nThe user has explicitly consented to granting you access to the following historical journal memory snippets:\n${consentedMemories
      .map((m, i) => `[Memory #${i + 1}]: ${redactPiiAndPhi(m).sanitizedText}`)
      .join('\n')}\nUse these memories subtly to foster empathetic continuity when relevant, but never force them unnecessarily.`;
  }

  let rawReply = '';
  if (!ai) {
    rawReply = fallbackChatReply(sanitizedHistory, sanitizedUserMessage, consentedMemories);
  } else {
    try {
      const contents = sanitizedHistory.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: sanitizedUserMessage }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      rawReply = response.text || "I'm listening closely. Tell me more about what that felt like.";
    } catch (error) {
      console.error('Error in Gemini generateChatReply:', error);
      rawReply = fallbackChatReply(sanitizedHistory, sanitizedUserMessage, consentedMemories);
    }
  }

  // 4. Output Validation & Medical Sanity Checking
  const validation = validateModelOutput(rawReply, crisisSignals.hasCrisisSignals);
  const validatedReply = validation.sanitizedOutput;
  const latencyMs = Date.now() - startTime;

  // 5. Full Audit Log Recording
  const auditLog = recordSafetyAuditLog({
    callerUid,
    userRole: callerRole,
    endpoint: '/session/message',
    promptLength: newMessage.length,
    responseLength: validatedReply.length,
    phiRedactionsCount: phiRedaction.redactionCount,
    phiTypesRedacted: phiRedaction.redactedTypes,
    riskTier: crisisSignals.severityTier,
    crisisCategory: crisisSignals.crisisCategory,
    isPromptInjection: false,
    escalationTriggered: crisisSignals.escalationRequired,
    modelId: 'gemini-3.8-flash',
    promptVersion: activeVersion.version,
    latencyMs,
    humanReviewStatus: crisisSignals.escalationRequired ? 'PENDING' : 'NOT_APPLICABLE',
    humanReviewId,
  });

  return {
    reply: validatedReply,
    crisisSignals,
    phiRedaction,
    promptInjectionBlocked: false,
    outputValidationFlags: validation.flags,
    auditLogId: auditLog.id,
    latencyMs,
  };
}

export async function summarizeSession(
  messages: ChatMessage[]
): Promise<SessionSummaryResult> {
  const ai = getAiClient();
  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Journal Companion'}: ${m.text}`)
    .join('\n\n');

  if (!ai) {
    return fallbackSummarize(messages);
  }

  try {
    const prompt = `Analyze this reflective journaling session and produce a structured summary.
Transcript:
${transcript}

Requirements:
1. summary: A concise, empathetic narrative summary (2-3 paragraphs maximum) capturing what the user explored, their emotions, and their realizations.
2. mood: A single dominant mood tag from one of: 'calm', 'reflective', 'excited', 'stressed', 'anxious', 'optimistic', 'creative', 'overwhelmed', 'grateful'.
3. themes: An array of 2 to 4 concise recurring theme or topic tags (e.g. 'work-boundaries', 'creativity', 'self-care', 'decision-making', 'family').
4. keyTakeaway: A single crisp sentence encapsulating the core insight or intention from this session.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Concise, empathetic summary of the journaling dialogue.',
            },
            mood: {
              type: Type.STRING,
              description: 'Single dominant mood tag.',
            },
            themes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2 to 4 recurring topic tags.',
            },
            keyTakeaway: {
              type: Type.STRING,
              description: 'Key reflective takeaway sentence.',
            },
          },
          required: ['summary', 'mood', 'themes', 'keyTakeaway'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || 'A reflective journaling conversation exploring current thoughts and daily experiences.',
      mood: sanitizeMood(parsed.mood),
      themes: Array.isArray(parsed.themes) && parsed.themes.length > 0 ? parsed.themes : ['reflection', 'daily-life'],
      keyTakeaway: parsed.keyTakeaway || 'Taking dedicated time to process thoughts brings clarity and calm.',
    };
  } catch (error) {
    console.error('Error in Gemini summarizeSession:', error);
    return fallbackSummarize(messages);
  }
}

/**
 * Semantic Lineage Trace: Analyzes past entries against a specific idea inquiry
 * (e.g., "how did my thinking on pricing model evolve?")
 */
export async function traceIdeaSemanticEvolution(
  entries: Array<{ entryId: string; createdAt: string; summary: string; mood: string; themes: string[]; keyTakeaway?: string }>,
  query: string
): Promise<{
  title: string;
  summaryNarrative: string;
  stages: Array<{
    date: string;
    stage: string;
    milestone: string;
    shift: string;
  }>;
  synthesis: string;
}> {
  const ai = getAiClient();
  const entriesContext = entries
    .map(
      (e, idx) =>
        `Entry #${idx + 1} (${new Date(e.createdAt).toLocaleDateString()} | Mood: ${e.mood} | Themes: ${e.themes.join(', ')}):\nSummary: ${e.summary}\nTakeaway: ${e.keyTakeaway || 'N/A'}`
    )
    .join('\n\n');

  if (!ai) {
    return fallbackTraceIdea(entries, query);
  }

  try {
    const prompt = `You are an Idea Lineage Tracker in a private journal app.
The user is asking: "${query}"
Below are their chronologically recorded journal entries:

${entriesContext}

Trace how this specific idea or theme evolved across these sessions.
Identify the progression from initial conception/spark, through friction or uncertainty, to breakthroughs and current status.
Return structured JSON with title, summaryNarrative, stages (array with date, stage, milestone, shift), and current synthesis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summaryNarrative: { type: Type.STRING },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  stage: { type: Type.STRING },
                  milestone: { type: Type.STRING },
                  shift: { type: Type.STRING },
                },
                required: ['date', 'stage', 'milestone', 'shift'],
              },
            },
            synthesis: { type: Type.STRING },
          },
          required: ['title', 'summaryNarrative', 'stages', 'synthesis'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (err) {
    console.error('Error in traceIdeaSemanticEvolution:', err);
    return fallbackTraceIdea(entries, query);
  }
}

function fallbackTraceIdea(
  entries: Array<{ entryId: string; createdAt: string; summary: string; mood: string; themes: string[]; keyTakeaway?: string }>,
  query: string
) {
  return {
    title: `Lineage Trace: "${query}"`,
    summaryNarrative: `Tracing this thread reveals clear intellectual momentum. Your thinking shifted from early uncertainty toward concrete boundaries and functional alignment.`,
    stages: entries.map((e, idx) => ({
      date: new Date(e.createdAt).toLocaleDateString(),
      stage: idx === 0 ? 'Conception & Initial Spark' : idx === 1 ? 'Friction & Nuance' : 'Breakthrough & Synthesis',
      milestone: e.summary.substring(0, 110) + '...',
      shift: e.keyTakeaway || 'Refined assumptions through practice.',
    })),
    synthesis: 'Your reflections demonstrate how sustained journaling transforms scattered initial thoughts into confident operational clarity.',
  };
}

function sanitizeMood(mood: string | undefined): string {
  const valid = ['calm', 'reflective', 'excited', 'stressed', 'anxious', 'optimistic', 'creative', 'overwhelmed', 'grateful'];
  const m = (mood || '').toLowerCase().trim();
  if (valid.includes(m)) return m;
  return 'reflective';
}

function fallbackChatReply(history: ChatMessage[], newMessage: string, memories: string[]): string {
  const lower = newMessage.toLowerCase();
  const hasMemories = memories.length > 0;
  const memoryNudge = hasMemories ? ' (building on your past reflections)' : '';

  if (lower.includes('stress') || lower.includes('overwhelm') || lower.includes('tired')) {
    return `It sounds like things have been demanding and heavy today${memoryNudge}. When you notice that tension, where do you feel it most, and what is one small thing within your control right now?`;
  }
  if (lower.includes('idea') || lower.includes('project') || lower.includes('pricing') || lower.includes('build')) {
    return `That sounds like a spark with real potential! What is the central problem you want this idea to solve, and what excites you most about exploring it?`;
  }
  if (lower.includes('feel') || lower.includes('worry') || lower.includes('think')) {
    return `Holding that thought openly is a great first step. If you look at this from another perspective, what insight or learning stands out to you?`;
  }
  return `Thank you for sharing that reflection. What feels like the most meaningful part of this situation for you as you reflect on it today?`;
}

function fallbackSummarize(messages: ChatMessage[]): SessionSummaryResult {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text)
    .join(' ');

  const lower = userText.toLowerCase();
  let mood = 'reflective';
  const themes = ['self-reflection'];

  if (lower.includes('stress') || lower.includes('tired') || lower.includes('busy')) {
    mood = 'stressed';
    themes.push('work-pressure', 'burnout-prevention');
  } else if (lower.includes('grateful') || lower.includes('good') || lower.includes('happy')) {
    mood = 'grateful';
    themes.push('gratitude', 'wellbeing');
  } else if (lower.includes('idea') || lower.includes('project') || lower.includes('create') || lower.includes('pricing')) {
    mood = 'creative';
    themes.push('brainstorming', 'pricing-strategy');
  } else if (lower.includes('hope') || lower.includes('future') || lower.includes('forward')) {
    mood = 'optimistic';
    themes.push('goals', 'growth');
  } else {
    themes.push('clarity', 'daily-processing');
  }

  return {
    summary: `In this session, you explored key thoughts around daily experiences and priorities. You articulated your perspective across ${messages.length} conversational turns, allowing mental space to step back and organize what matters most.`,
    mood,
    themes,
    keyTakeaway: 'Giving words to internal dialogue fosters perspective and emotional resilience.',
  };
}
