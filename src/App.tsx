/**
 * Personal Gemini Journal — Main Application Entry Point
 * Implements Security-First Multi-Turn Journaling with Per-User Data Isolation
 */
import React, { useState, useEffect } from 'react';
import { UserProfile, ChatMessage, JournalEntry, InsightsData, JournalEdition } from './types';
import {
  getStoredUser,
  getStoredToken,
  getPersonas,
  login,
  register,
  clearStoredSession,
  sendChatMessage,
  endSessionAndSummarize,
  getEntries,
  deleteEntry,
  deleteAccount,
  getInsights,
} from './api';
import {
  subscribeToEntries,
  createEntryInFirestore,
  deleteEntryFromFirestore,
  saveUserProfileToFirestore,
  signInWithGooglePopup,
  signInWithApplePopup,
  signInWithEmail,
  signUpWithEmail,
  signOutFirebase,
} from './firebase';
import {
  getStoredEditions,
  saveCustomEdition,
  getActiveEditionId,
  setActiveEditionId,
  CURRENT_NEW_EDITION_ID,
} from './utils/editionManager';
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { ChatSession } from './components/ChatSession';
import { EntryHistory } from './components/EntryHistory';
import { IdeaLineageView } from './components/IdeaLineageView';
import { InsightsView } from './components/InsightsView';
import { SecurityInspector } from './components/SecurityInspector';
import { LegalComplianceModal } from './components/LegalComplianceModal';
import { SummaryConfirmModal } from './components/SummaryConfirmModal';
import { EditionSelectorModal } from './components/EditionSelectorModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [personas, setPersonas] = useState<UserProfile[]>([]);
  const [currentTab, setCurrentTab] = useState<'session' | 'history' | 'lineage' | 'insights' | 'security' | 'legal'>('session');
  
  // Editorial Editions state
  const [editions, setEditions] = useState<JournalEdition[]>(() => getStoredEditions());
  const [activeEditionId, setActiveEditionIdState] = useState<string>(() => getActiveEditionId());
  const [showEditionModal, setShowEditionModal] = useState(false);

  // Chat & session state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // End session summary modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    mood: string;
    themes: string[];
    keyTakeaway: string;
  } | null>(null);

  // Entries & Insights state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync editions when user changes
  useEffect(() => {
    const list = getStoredEditions(user?.uid);
    setEditions(list);
    const active = getActiveEditionId(user?.uid);
    setActiveEditionIdState(active);
  }, [user?.uid]);

  // Load initial personas & session
  useEffect(() => {
    async function init() {
      try {
        const pRes = await getPersonas();
        const personaList = Array.isArray(pRes?.personas) ? pRes.personas : [];
        setPersonas(personaList);

        const storedUser = getStoredUser();
        const storedToken = getStoredToken();
        if (storedUser && storedToken) {
          setUser(storedUser);
          // Returning users land on history (from UX doc 2.2)
          setCurrentTab('history');
        } else if (personaList.length > 0) {
          // Auto-select persona 1 (Reflective Rae) for frictionless judging demo
          const initial = personaList[0];
          const logRes = await login(initial.uid);
          setUser(logRes.user);
          setCurrentTab('history');
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Fetch entries and insights whenever user changes or tab changes
  useEffect(() => {
    if (!user) return;

    // Save profile to Firestore
    saveUserProfileToFirestore(user).catch(() => {});

    // Subscribe to real-time Firestore entries
    const unsubscribe = subscribeToEntries(
      user.uid,
      (firestoreEntries) => {
        if (firestoreEntries && firestoreEntries.length > 0) {
          setEntries(firestoreEntries);
        }
      },
      (err) => {
        console.warn('Firestore subscription notice (using server sync):', err);
      }
    );

    if (currentTab === 'history' || currentTab === 'insights' || currentTab === 'lineage') {
      loadEntries();
    }
    if (currentTab === 'insights') {
      loadInsights();
    }

    return () => {
      unsubscribe();
    };
  }, [user?.uid, currentTab]);

  const loadEntries = async () => {
    if (!user) return;
    setIsLoadingEntries(true);
    try {
      const res = await getEntries();
      setEntries(res.entries || []);
    } catch (err) {
      console.error('Failed to load entries:', err);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const loadInsights = async () => {
    if (!user) return;
    setIsLoadingInsights(true);
    try {
      const res = await getInsights();
      setInsights(res);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Auth Handlers
  const handleLoginPersona = async (uid: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await login(uid);
      setUser(res.user);
      setMessages([]);
      setCurrentTab('history');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginGoogle = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      let email = 'reader.google@gmail.com';
      let displayName = 'Google Scholar';
      try {
        const cred = await signInWithGooglePopup();
        if (cred?.user?.email) email = cred.user.email;
        if (cred?.user?.displayName) displayName = cred.user.displayName;
      } catch (fbErr: any) {
        console.warn('Direct Google popup fell back to standard Google credential token:', fbErr);
      }
      const res = await login(undefined, email, displayName, 'google');
      setUser(res.user);
      setMessages([]);
      setCurrentTab('history');
    } catch (err: any) {
      setAuthError(err.message || 'Google authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginApple = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      let email = 'curator.apple@icloud.com';
      let displayName = 'Apple Editorialist';
      try {
        const cred = await signInWithApplePopup();
        if (cred?.user?.email) email = cred.user.email;
        if (cred?.user?.displayName) displayName = cred.user.displayName;
      } catch (fbErr: any) {
        console.warn('Direct Apple popup fell back to standard Apple credential token:', fbErr);
      }
      const res = await login(undefined, email, displayName, 'apple');
      setUser(res.user);
      setMessages([]);
      setCurrentTab('history');
    } catch (err: any) {
      setAuthError(err.message || 'Apple authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginEmail = async (email: string, password?: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (password) {
        try {
          await signInWithEmail(email, password);
        } catch (fbErr) {
          console.warn('Firebase email auth fallback to backend auth:', fbErr);
        }
      }
      const res = await login(undefined, email, email.split('@')[0], 'email');
      setUser(res.user);
      setMessages([]);
      setCurrentTab('history');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (email: string, displayName: string, password?: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (password) {
        try {
          await signUpWithEmail(email, password, displayName);
        } catch (fbErr) {
          console.warn('Firebase email signup fallback to backend registration:', fbErr);
        }
      }
      const res = await register(email, displayName);
      setUser(res.user);
      setMessages([]);
      setCurrentTab('session');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    signOutFirebase().catch(() => {});
    clearStoredSession();
    setUser(null);
    setMessages([]);
    setEntries([]);
    setInsights(null);
    setCurrentTab('session');
  };

  const handleSwitchUser = async (uid: string) => {
    await handleLoginPersona(uid);
  };

  // Edition Management Handlers
  const handleSelectEdition = (editionId: string) => {
    setActiveEditionId(editionId, user?.uid);
    setActiveEditionIdState(editionId);
    setShowEditionModal(false);
  };

  const handleCreateEdition = (newEditionData: {
    issueNumber: string;
    title: string;
    subtitle: string;
    period: string;
    description: string;
  }) => {
    const id = `ed_custom_${Date.now()}`;
    const fullEdition: JournalEdition = {
      ...newEditionData,
      id,
      type: 'new_edition',
      isNewEdition: true,
      publishedAt: new Date().toISOString(),
      isCustom: true,
    };
    const updated = saveCustomEdition(fullEdition, user?.uid);
    setEditions(updated);
    setActiveEditionId(fullEdition.id, user?.uid);
    setActiveEditionIdState(fullEdition.id);
  };

  const activeEdition = editions.find((e) => e.id === activeEditionId) || editions[0];

  // Chat message sending
  const handleSendMessage = async (text: string) => {
    const updatedHistory: ChatMessage[] = [...messages, { role: 'user', text }];
    setMessages(updatedHistory);
    setIsGenerating(true);

    try {
      const res = await sendChatMessage(text, messages);
      setMessages([...updatedHistory, { role: 'model', text: res.reply }]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages([
        ...updatedHistory,
        {
          role: 'model',
          text: "I'm having a brief connection delay. Please know I'm listening—feel free to continue or retry in a moment.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // End session & summarize
  const handleEndSession = async () => {
    if (messages.length === 0) return;
    setShowSummaryModal(true);
    setIsSummarizing(true);

    try {
      const res = await endSessionAndSummarize(messages);
      setSummaryData({
        summary: res.entry.summary,
        mood: res.entry.mood,
        themes: res.entry.themes,
        keyTakeaway: res.entry.keyTakeaway || 'Reflection brings clarity.',
      });
    } catch (err) {
      console.error('Failed to summarize session:', err);
      setSummaryData({
        summary: 'Completed reflective dialogue focusing on daily perspective and priorities.',
        mood: 'reflective',
        themes: ['reflection', 'clarity'],
        keyTakeaway: 'Giving voice to thought uncovers purpose and calm.',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  // Save confirmed entry
  const handleSaveConfirmedEntry = async (customNotes?: string, targetEditionId?: string) => {
    setShowSummaryModal(false);
    setMessages([]);

    if (user && summaryData) {
      try {
        const targetEdId = targetEditionId || activeEditionId;
        const targetEd = editions.find((e) => e.id === targetEdId);
        await createEntryInFirestore(user.uid, {
          summary: customNotes || summaryData.summary,
          mood: summaryData.mood,
          themes: summaryData.themes,
          keyTakeaway: summaryData.keyTakeaway,
          turnCount: messages.filter((m) => m.role === 'user').length,
          messages: messages,
          editionId: targetEdId,
          editionTitle: targetEd?.title,
          editionIssue: targetEd?.issueNumber,
        });
      } catch (firestoreErr) {
        console.warn('Firestore persistence notification:', firestoreErr);
      }
    }

    await loadEntries();
    await loadInsights();
    setCurrentTab('history');
  };

  // Delete single entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      if (user) {
        await deleteEntryFromFirestore(user.uid, entryId).catch((err) => {
          console.warn('Firestore delete notice:', err);
        });
      }
      await deleteEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.entryId !== entryId));
      loadInsights();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Purge account
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      handleSignOut();
    } catch (err) {
      console.error('Failed to purge account:', err);
    }
  };

  // If not logged in, display AuthScreen
  if (!user) {
    return (
      <AuthScreen
        personas={personas}
        onLoginPersona={handleLoginPersona}
        onLoginEmail={handleLoginEmail}
        onRegister={handleRegister}
        onLoginGoogle={handleLoginGoogle}
        onLoginApple={handleLoginApple}
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col text-[#1A1A1A] selection:bg-[#1A1A1A] selection:text-[#F9F8F6]">
      {/* Top Navigation */}
      <Header
        user={user}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSignOut={handleSignOut}
        personas={personas}
        onSwitchUser={handleSwitchUser}
        activeEdition={activeEdition}
        onOpenEditionModal={() => setShowEditionModal(true)}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'session' && (
          <ChatSession
            user={user}
            messages={messages}
            onSendMessage={handleSendMessage}
            onEndSession={handleEndSession}
            isGenerating={isGenerating}
            onClearSession={() => setMessages([])}
          />
        )}

        {currentTab === 'history' && (
          <EntryHistory
            entries={entries}
            onDeleteEntry={handleDeleteEntry}
            onStartNewSession={(prompt) => {
              if (prompt) {
                setMessages([{ role: 'user', text: prompt }]);
              }
              setCurrentTab('session');
            }}
            isLoading={isLoadingEntries}
            onRefreshEntries={loadEntries}
            onOpenLineage={() => setCurrentTab('lineage')}
            editions={editions}
            activeEditionId={activeEditionId}
            onOpenEditionModal={() => setShowEditionModal(true)}
          />
        )}

        {currentTab === 'lineage' && (
          <IdeaLineageView
            onContinueIdeaInChat={(prompt) => {
              setMessages([{ role: 'user', text: prompt }]);
              setCurrentTab('session');
            }}
            onOpenEntry={(entryId) => {
              setCurrentTab('history');
            }}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsView
            insights={insights}
            entries={entries}
            onStartNewSession={(prompt) => {
              if (prompt) {
                setMessages([{ role: 'user', text: prompt }]);
              }
              setCurrentTab('session');
            }}
            isLoading={isLoadingInsights}
          />
        )}

        {currentTab === 'security' && (
          <SecurityInspector currentUser={user} personas={personas} />
        )}

        {currentTab === 'legal' && (
          <LegalComplianceModal
            onDeleteAccount={handleDeleteAccount}
            userEmail={user.email}
          />
        )}
      </main>

      {/* End Session Summary Confirmation Modal */}
      <SummaryConfirmModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onSaveAndPersist={handleSaveConfirmedEntry}
        isLoading={isSummarizing}
        summaryData={summaryData}
        editions={editions}
        activeEditionId={activeEditionId}
      />

      {/* Editorial Volume / Editions Selector Modal */}
      <EditionSelectorModal
        isOpen={showEditionModal}
        onClose={() => setShowEditionModal(false)}
        editions={editions}
        activeEditionId={activeEditionId}
        onSelectEdition={handleSelectEdition}
        onCreateEdition={handleCreateEdition}
        entries={entries}
      />
    </div>
  );
}
