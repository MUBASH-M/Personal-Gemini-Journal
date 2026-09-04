import { JournalEdition, JournalEntry } from '../types';

export const ARCHIVAL_EDITION_ID = 'ed_archival_04';
export const CURRENT_NEW_EDITION_ID = 'ed_new_05';
export const SYNTHESIS_NEW_EDITION_ID = 'ed_new_06';

export const DEFAULT_EDITIONS: JournalEdition[] = [
  {
    id: ARCHIVAL_EDITION_ID,
    issueNumber: 'Issue No. 04',
    title: 'Archival Edition',
    subtitle: 'Foundational Retrospective & Genesis Vault (2024–2025)',
    type: 'archival',
    period: '2024–2025 Archive',
    description:
      'A preserved historical catalog of foundational thoughts, early cryptographic genesis hashes, and exploratory prompts captured in the initial cycles of private introspection.',
    isNewEdition: false,
    publishedAt: '2025-12-31T23:59:59Z',
  },
  {
    id: CURRENT_NEW_EDITION_ID,
    issueNumber: 'Issue No. 05',
    title: 'Living Horizon',
    subtitle: 'Current Inquiries & Real-Time Thought (2026 Volume I)',
    type: 'new_edition',
    period: '2026 Volume I',
    description:
      'The active, living folio of present reflections, daily friction, emotional weather shifts, and breakthrough realizations. Fresh journal entries default to this edition.',
    isNewEdition: true,
    publishedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: SYNTHESIS_NEW_EDITION_ID,
    issueNumber: 'Issue No. 06',
    title: 'Synthesis & Trajectory',
    subtitle: 'Metacognitive Arcs & Extended Ideation (2026 Volume II)',
    type: 'special_folio',
    period: '2026 Volume II',
    description:
      'Curated deep reflections focusing on long-term idea lineages, architectural breakthroughs, and semantic transformations traced across months of disciplined writing.',
    isNewEdition: true,
    publishedAt: '2026-06-15T12:00:00Z',
  },
];

const EDITIONS_STORAGE_PREFIX = 'pgj_custom_editions_';
const ACTIVE_EDITION_PREFIX = 'pgj_active_edition_';

export function getStoredEditions(userId?: string): JournalEdition[] {
  const key = userId ? `${EDITIONS_STORAGE_PREFIX}${userId}` : `${EDITIONS_STORAGE_PREFIX}default`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_EDITIONS;
    const customList: JournalEdition[] = JSON.parse(raw);
    // Merge defaults with custom, avoiding duplicate IDs
    const merged = [...DEFAULT_EDITIONS];
    for (const c of customList) {
      if (!merged.some((d) => d.id === c.id)) {
        merged.push(c);
      }
    }
    return merged;
  } catch {
    return DEFAULT_EDITIONS;
  }
}

export function saveCustomEdition(edition: JournalEdition, userId?: string): JournalEdition[] {
  const current = getStoredEditions(userId);
  const updated = [...current.filter((e) => e.id !== edition.id), edition];
  const key = userId ? `${EDITIONS_STORAGE_PREFIX}${userId}` : `${EDITIONS_STORAGE_PREFIX}default`;
  try {
    const customOnly = updated.filter((e) => !DEFAULT_EDITIONS.some((d) => d.id === e.id));
    localStorage.setItem(key, JSON.stringify(customOnly));
  } catch (err) {
    console.warn('Failed to persist custom edition:', err);
  }
  return updated;
}

export function getActiveEditionId(userId?: string): string {
  const key = userId ? `${ACTIVE_EDITION_PREFIX}${userId}` : `${ACTIVE_EDITION_PREFIX}default`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return stored;
  } catch {}
  // Default to the living New Edition
  return CURRENT_NEW_EDITION_ID;
}

export function setActiveEditionId(editionId: string, userId?: string): void {
  const key = userId ? `${ACTIVE_EDITION_PREFIX}${userId}` : `${ACTIVE_EDITION_PREFIX}default`;
  try {
    localStorage.setItem(key, editionId);
  } catch (err) {
    console.warn('Failed to save active edition ID:', err);
  }
}

export function resolveEditionForEntry(
  entry: Partial<JournalEntry>,
  editions: JournalEdition[]
): JournalEdition {
  if (entry.editionId) {
    const matched = editions.find((e) => e.id === entry.editionId);
    if (matched) return matched;
  }
  
  // If entry was created in 2025 or earlier, or has historical index, it defaults to Archival Edition
  if (entry.createdAt) {
    const entryDate = new Date(entry.createdAt);
    if (entryDate.getFullYear() <= 2025) {
      const archival = editions.find((e) => e.id === ARCHIVAL_EDITION_ID);
      if (archival) return archival;
    }
  }

  // Otherwise default to the Living Horizon New Edition
  const newEdition = editions.find((e) => e.id === CURRENT_NEW_EDITION_ID) || editions[0];
  return newEdition;
}
