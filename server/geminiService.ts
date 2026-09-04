/**
 * Server-Side Gemini Service
 * Implements Phase 1 Constitution: No keys sent to client, least privilege, auditable.
 * Enforces Memory Consent Ledger filtering (only user-consented context injected).
 */
import { GoogleGenAI, Type } from '@google/genai';

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

const BASE_SYSTEM_INSTRUCTION = `You are a thoughtful, empathetic, and security-conscious journaling companion in the Personal Gemini Journal.
Your role is to help the user unpack their day, untangle complex feelings, or brainstorm creative ideas.
Guidelines:
- Listen actively and respond with warmth, clarity, and curiosity.
- Ask one gentle, thought-provoking follow-up question per turn to help them go deeper.
- Never be clinical, judgmental, or dismissive.
- Keep responses concise (2 to 4 sentences) so the conversation feels like a natural dialogue, not a lecture.
- Respect their personal reflections as private and meaningful.`;

export async function generateChatReply(
  history: ChatMessage[],
  newMessage: string,
  consentedMemories: string[] = []
): Promise<string> {
  const ai = getAiClient();

  let systemInstruction = BASE_SYSTEM_INSTRUCTION;
  if (consentedMemories.length > 0) {
    systemInstruction += `\n\n--- MEMORY CONSENT LEDGER CONTEXT ---\nThe user has explicitly consented to granting you access to the following historical journal memory snippets:\n${consentedMemories
      .map((m, i) => `[Memory #${i + 1}]: ${m}`)
      .join('\n')}\nUse these memories subtly to foster empathetic continuity when relevant, but never force them unnecessarily.`;
  }

  if (!ai) {
    // Graceful fallback if GEMINI_API_KEY is not configured
    return fallbackChatReply(history, newMessage, consentedMemories);
  }

  try {
    // Format conversation history for Gemini
    const contents = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm listening closely. Tell me more about what that felt like.";
  } catch (error) {
    console.error('Error in Gemini generateChatReply:', error);
    return fallbackChatReply(history, newMessage, consentedMemories);
  }
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
