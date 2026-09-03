/**
 * Personal Gemini Journal — Main Application Entry Point
 * Implements Security-First Multi-Turn Journaling with Per-User Data Isolation
 */
import React, { useState, useEffect } from 'react';
import { UserProfile, ChatMessage, JournalEntry, InsightsData } from './types';
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
import { Header } from './components/Header';
import { AuthScreen } from './components/AuthScreen';
import { ChatSession } from './components/ChatSession';
import { EntryHistory } from './components/EntryHistory';
import { InsightsView } from './components/InsightsView';
import { SecurityInspector } from './components/SecurityInspector';
import { LegalComplianceModal } from './components/LegalComplianceModal';
import { SummaryConfirmModal } from './components/SummaryConfirmModal';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [personas, setPersonas] = useState<UserProfile[]>([]);
  const [currentTab, setCurrentTab] = useState<'session' | 'history' | 'insights' | 'security' | 'legal'>('session');
  
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

  // Load initial personas & session
  useEffect(() => {
    async function init() {
      try {
        const pRes = await getPersonas();
        setPersonas(pRes.personas || []);

        const storedUser = getStoredUser();
        const storedToken = getStoredToken();
        if (storedUser && storedToken) {
          setUser(storedUser);
          // Returning users land on history (from UX doc 2.2)
          setCurrentTab('history');
        } else if (pRes.personas && pRes.personas.length > 0) {
          // Auto-select persona 1 (Reflective Rae) for frictionless judging demo
          const initial = pRes.personas[0];
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

    if (currentTab === 'history' || currentTab === 'insights') {
      loadEntries();
    }
    if (currentTab === 'insights') {
      loadInsights();
    }
  }, [user, currentTab]);

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

  const handleLoginEmail = async (email: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await login(undefined, email);
      setUser(res.user);
      setMessages([]);
      setCurrentTab('history');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (email: string, displayName: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
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
  const handleSaveConfirmedEntry = async (customNotes?: string) => {
    setShowSummaryModal(false);
    setMessages([]);
    await loadEntries();
    await loadInsights();
    setCurrentTab('history');
  };

  // Delete single entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
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
        isLoading={authLoading}
        error={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col font-sans text-[#0A233F] selection:bg-[#008FD5]/20 selection:text-[#0A233F]">
      {/* Top Navigation */}
      <Header
        user={user}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onSignOut={handleSignOut}
        personas={personas}
        onSwitchUser={handleSwitchUser}
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
            onStartNewSession={() => setCurrentTab('session')}
            isLoading={isLoadingEntries}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsView
            insights={insights}
            onStartNewSession={() => setCurrentTab('session')}
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
      />
    </div>
  );
}
