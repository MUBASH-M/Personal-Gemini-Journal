/**
 * Server-Side Gemini Service
 * Implements Phase 1 Constitution: No keys sent to client, least privilege, auditable.
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

const JOURNAL_SYSTEM_INSTRUCTION = `You are a thoughtful, empathetic, and security-conscious journaling companion in the Personal Gemini Journal.
Your role is to help the user unpack their day, untangle complex feelings, or brainstorm creative ideas.
Guidelines:
- Listen actively and respond with warmth, clarity, and curiosity.
- Ask one gentle, thought-provoking follow-up question per turn to help them go deeper.
- Never be clinical, judgmental, or dismissive.
- Keep responses concise (2 to 4 sentences) so the conversation feels like a natural dialogue, not a lecture.
- Respect their personal reflections as private and meaningful.`;

export async function generateChatReply(
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  const ai = getAiClient();
  if (!ai) {
    // Graceful fallback if GEMINI_API_KEY is not configured
    return fallbackChatReply(history, newMessage);
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
        systemInstruction: JOURNAL_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "I'm listening closely. Tell me more about what that felt like.";
  } catch (error) {
    console.error('Error in Gemini generateChatReply:', error);
    return fallbackChatReply(history, newMessage);
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

function sanitizeMood(mood: string | undefined): string {
  const valid = ['calm', 'reflective', 'excited', 'stressed', 'anxious', 'optimistic', 'creative', 'overwhelmed', 'grateful'];
  const m = (mood || '').toLowerCase().trim();
  if (valid.includes(m)) return m;
  return 'reflective';
}

function fallbackChatReply(history: ChatMessage[], newMessage: string): string {
  const lower = newMessage.toLowerCase();
  if (lower.includes('stress') || lower.includes('overwhelm') || lower.includes('tired')) {
    return 'It sounds like things have been demanding and heavy today. When you notice that tension, where do you feel it most, and what is one small thing within your control right now?';
  }
  if (lower.includes('idea') || lower.includes('project') || lower.includes('build')) {
    return 'That sounds like a spark with real potential! What is the central problem you want this idea to solve, and what excites you most about exploring it?';
  }
  if (lower.includes('feel') || lower.includes('worry') || lower.includes('think')) {
    return 'Holding that thought openly is a great first step. If you look at this from another perspective, what insight or learning stands out to you?';
  }
  return 'Thank you for sharing that reflection. What feels like the most meaningful part of this situation for you as you reflect on it today?';
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
  } else if (lower.includes('idea') || lower.includes('project') || lower.includes('create')) {
    mood = 'creative';
    themes.push('brainstorming', 'innovation');
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
