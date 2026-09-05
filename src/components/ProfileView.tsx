import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, JournalEdition } from '../types';
import { saveUserProfileToFirestore, getProviderLoginPhotoURL, auth } from '../firebase';
import { updateUserProfileApi } from '../api';
import {
  User,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Heart,
  BookOpen,
  Mail,
  Fingerprint,
  RefreshCw,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  editions?: JournalEdition[];
  activeEditionId?: string;
  onSelectEdition?: (editionId: string) => void;
  onNavigateToTab?: (tab: 'session' | 'history' | 'security') => void;
}

// Curated aesthetic avatars fitting the paper-ink editorial journal
const CURATED_AVATARS = [
  {
    id: 'avatar-scholar',
    label: 'Botanical Scholar',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-thinker',
    label: 'Deep Inquirer',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-creative',
    label: 'Creative Writer',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-zen',
    label: 'Zen Contemplative',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-curator',
    label: 'Folio Curator',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'avatar-architect',
    label: 'Mindful Architect',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  onUpdateUser,
  editions = [],
  activeEditionId,
  onSelectEdition,
  onNavigateToTab,
}) => {
  // Form State
  const [displayName, setDisplayName] = useState(currentUser.displayName || '');
  const [photoURL, setPhotoURL] = useState(currentUser.photoURL || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [role, setRole] = useState(currentUser.role || 'Private Journaler');
  const [pronouns, setPronouns] = useState(currentUser.pronouns || '');
  const [intention, setIntention] = useState(currentUser.intention || '');
  const [sobrietyDate, setSobrietyDate] = useState(currentUser.sobrietyDate || '');
  const [recoveryContact, setRecoveryContact] = useState(currentUser.recoveryContact || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if currentUser prop changes
  useEffect(() => {
    setDisplayName(currentUser.displayName || '');
    setPhotoURL(currentUser.photoURL || '');
    setBio(currentUser.bio || '');
    setRole(currentUser.role || 'Private Journaler');
    setPronouns(currentUser.pronouns || '');
    setIntention(currentUser.intention || '');
    setSobrietyDate(currentUser.sobrietyDate || '');
    setRecoveryContact(currentUser.recoveryContact || '');
  }, [currentUser]);

  // Calculate days elapsed for milestone date
  const calculateMilestoneDays = (dateStr: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const diffTime = Math.abs(Date.now() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const milestoneDays = calculateMilestoneDays(sobrietyDate);

  // Detect provider photo availability
  const providerPhoto = getProviderLoginPhotoURL(currentUser);
  const isGmailUser =
    currentUser.email?.toLowerCase().includes('@gmail.com') ||
    currentUser.email?.toLowerCase().includes('@googlemail.com') ||
    currentUser.authProvider === 'google';
  const isAppleUser =
    currentUser.email?.toLowerCase().includes('@icloud.com') ||
    currentUser.email?.toLowerCase().includes('@apple.com') ||
    currentUser.authProvider === 'apple';

  // Handle image upload & downscale via canvas to keep within Firestore/localStorage limits
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSaveError('Please select a valid image file (JPG, PNG, WebP, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400; // 400x400 max avatar dimension
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoURL(compressedDataUrl);
          setSaveError(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = () => {
    if (imageUrlInput.trim()) {
      setPhotoURL(imageUrlInput.trim());
      setImageUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleUseProviderImage = () => {
    if (providerPhoto) {
      setPhotoURL(providerPhoto);
      setSaveSuccess(false);
    } else {
      // Fallback: construct standard Google or Apple unavatar
      const email = currentUser.email || auth.currentUser?.email;
      if (email) {
        if (isAppleUser) {
          setPhotoURL(`https://unavatar.io/apple/${encodeURIComponent(email.split('@')[0])}`);
        } else {
          setPhotoURL(`https://unavatar.io/google/${encodeURIComponent(email)}`);
        }
      }
    }
  };

  // Submit and Persist Profile to Firestore & Backend
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setSaveError('Display Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updatedProfile: UserProfile = {
        ...currentUser,
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || undefined,
        bio: bio.trim() || undefined,
        role: role.trim() || 'Private Journaler',
        pronouns: pronouns.trim() || undefined,
        intention: intention.trim() || undefined,
        sobrietyDate: sobrietyDate || undefined,
        recoveryContact: recoveryContact.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      // 1. Persist to Cloud Firestore & Firebase Auth
      await saveUserProfileToFirestore(updatedProfile);

      // 2. Persist to backend API session
      await updateUserProfileApi({
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoURL,
        bio: updatedProfile.bio,
        role: updatedProfile.role,
        pronouns: updatedProfile.pronouns,
        intention: updatedProfile.intention,
        sobrietyDate: updatedProfile.sobrietyDate,
        recoveryContact: updatedProfile.recoveryContact,
      }).catch((err) => {
        console.warn('Backend profile update note:', err);
      });

      // 3. Update parent state
      onUpdateUser(updatedProfile);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      setSaveError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="profile-page" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="border-b border-[#1A1A1A]/15 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#8C271E] font-bold">
              <User className="w-3.5 h-3.5" />
              <span>Identity &amp; Folio Authorship</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] mt-1 tracking-tight">
              Member Profile &amp; Preferences
            </h1>
            <p className="text-xs sm:text-sm font-serif italic text-[#1A1A1A]/65 mt-1 max-w-2xl">
              Curate your personal reflection persona, avatar portrait, milestone intentions, and verified cloud ownership.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider bg-white border border-[#1A1A1A]/20 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#3B5A30]"></span>
              <span>Firestore Path: /users/{currentUser.uid.slice(0, 10)}...</span>
            </span>
          </div>
        </div>

        {/* Feedback banners */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-[#3B5A30]/10 border border-[#3B5A30] text-[#3B5A30] text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile successfully updated and synced with Cloud Firestore.</span>
          </div>
        )}
        {saveError && (
          <div className="mt-4 p-3 bg-[#8C271E]/10 border border-[#8C271E] text-[#8C271E] text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: Portrait & Avatar Studio */}
        <div className="bg-[#FAF9F7] border border-[#1A1A1A]/15 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#8C271E]" />
              <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                Profile Portrait &amp; Visual Identity
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/50">
              Personal Picture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Avatar Display & Dropzone */}
            <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer w-32 h-32 sm:w-36 sm:h-36 border-2 flex items-center justify-center transition-all overflow-hidden ${
                  isDragging
                    ? 'border-[#8C271E] bg-[#8C271E]/5 scale-105'
                    : 'border-[#1A1A1A] bg-white hover:border-[#8C271E]'
                } shadow-md`}
                title="Click or drag an image file to upload your profile picture"
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName || 'User Portrait'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#F2EFE9] text-[#1A1A1A] select-none p-2">
                    <span className="font-serif text-4xl sm:text-5xl font-bold italic">
                      {(displayName || 'J').charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-[#1A1A1A]/50 mt-1">
                      No Photo Set
                    </span>
                  </div>
                )}

                {/* Overlay hover prompt */}
                <div className="absolute inset-0 bg-[#1A1A1A]/70 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                    Upload Picture
                  </span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="space-y-1">
                <p className="font-serif font-bold text-sm text-[#1A1A1A]">
                  {displayName || 'Anonymous Member'}
                </p>
                <p className="text-[10px] font-mono text-[#1A1A1A]/60 truncate max-w-[200px]">
                  {currentUser.email}
                </p>
              </div>

              {photoURL && (
                <button
                  type="button"
                  onClick={() => setPhotoURL('')}
                  className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[#8C271E] hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Picture</span>
                </button>
              )}
            </div>

            {/* Right: Picture Source Controls */}
            <div className="md:col-span-8 space-y-4">
              <p className="text-xs font-serif text-[#1A1A1A]/80">
                You can upload a personal photograph, pull your profile image directly from your email account avatar, enter an image URL, or choose an editorial portrait.
              </p>

              {/* Source Option Buttons */}
              <div className="flex flex-wrap gap-2">
                {/* Provider Photo Sync Button */}
                <button
                  id="profile-use-login-photo-btn"
                  type="button"
                  onClick={handleUseProviderImage}
                  className="px-3 py-2 bg-white hover:bg-[#F2EFE9] border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A] inline-flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                  title="Use the profile photo associated with your email account"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8C271E]" />
                  <span>Use Account / Web Avatar</span>
                </button>

                {/* Local Upload Button */}
                <button
                  id="profile-upload-local-photo-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-white hover:bg-[#F2EFE9] border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A] inline-flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#1A1A1A]" />
                  <span>Upload File</span>
                </button>

                {/* Direct URL Toggle */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-2 bg-white hover:bg-[#F2EFE9] border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-xs font-mono uppercase tracking-wider text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Image URL</span>
                </button>
              </div>

              {/* URL Input Box */}
              {showUrlInput && (
                <div className="p-3 bg-white border border-[#1A1A1A]/15 space-y-2 animate-in fade-in">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/60 font-bold">
                    Direct Image URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/my-photo.jpg"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#FAF9F7] border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs font-mono uppercase tracking-wider font-bold hover:bg-black transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Curated Editorial Portraits */}
              <div className="space-y-2 pt-2">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/60 font-bold">
                  Or select a curated journal portrait:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CURATED_AVATARS.map((avatar) => {
                    const isSelected = photoURL === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setPhotoURL(avatar.url)}
                        className={`group relative flex flex-col items-center p-1 bg-white border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#8C271E] ring-2 ring-[#8C271E]/20'
                            : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]'
                        }`}
                        title={avatar.label}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.label}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover"
                        />
                        <span className="text-[9px] font-mono text-[#1A1A1A]/70 truncate w-full text-center mt-1">
                          {avatar.label.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#8C271E] text-white rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Core Personal & Editorial Details */}
        <div className="bg-[#FAF9F7] border border-[#1A1A1A]/15 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#8C271E]" />
              <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                Authorship &amp; Personal Particulars
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/50">
              Identity Details
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="profile-display-name-input"
                className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
              >
                Display Name <span className="text-[#8C271E]">*</span>
              </label>
              <input
                id="profile-display-name-input"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rae Chen or Mubashir"
                className="w-full px-3 py-2 text-sm font-serif bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A] transition-colors"
              />
              <p className="text-[10px] font-serif italic text-[#1A1A1A]/60">
                Appears on your journal receipts, conversational greetings, and archival folio entries.
              </p>
            </div>

            {/* Email Address (Read-only + Verified status) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]">
                Registered Account Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F2EFE9] border border-[#1A1A1A]/15 text-[#1A1A1A]/80 font-mono text-xs">
                <Mail className="w-3.5 h-3.5 text-[#1A1A1A]/50 shrink-0" />
                <span className="truncate flex-1">{currentUser.email}</span>
                <span className="px-1.5 py-0.5 bg-white border border-[#1A1A1A]/20 text-[9px] uppercase font-bold text-[#3B5A30]">
                  Verified
                </span>
              </div>
              <p className="text-[10px] font-serif italic text-[#1A1A1A]/60">
                Managed securely via Firebase Authentication with zero cross-tenant leakage.
              </p>
            </div>

            {/* Role / Editorial Moniker */}
            <div className="space-y-1.5">
              <label
                htmlFor="profile-role-select"
                className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
              >
                Editorial Role / Moniker
              </label>
              <select
                id="profile-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
              >
                <option value="Private Journaler">Private Journaler</option>
                <option value="Mindful Inquirer">Mindful Inquirer</option>
                <option value="Creative Thinker &amp; Essayist">Creative Thinker &amp; Essayist</option>
                <option value="Philosophical Writer">Philosophical Writer</option>
                <option value="Research Fellow &amp; Scholar">Research Fellow &amp; Scholar</option>
                <option value="Care Provider / Clinician">Care Provider / Clinician</option>
                <option value="Recovery &amp; Wellness Member">Recovery &amp; Wellness Member</option>
              </select>
            </div>

            {/* Pronouns */}
            <div className="space-y-1.5">
              <label
                htmlFor="profile-pronouns-input"
                className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
              >
                Preferred Pronouns
              </label>
              <input
                id="profile-pronouns-input"
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="e.g. they/them, she/her, he/him"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Intention / Mantra */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-intention-textarea"
              className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
            >
              Guiding Reflection Intention / Personal Mantra
            </label>
            <textarea
              id="profile-intention-textarea"
              rows={2}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g. Cultivating emotional honesty and daily clarity through unvarnished reflection."
              className="w-full px-3 py-2 text-sm font-serif bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="text-[#1A1A1A]/50 py-0.5">Quick Inspiration:</span>
              <button
                type="button"
                onClick={() => setIntention('Honest decompression and thoughtful clarity without judgment.')}
                className="px-2 py-0.5 bg-white border border-[#1A1A1A]/15 hover:border-[#1A1A1A] text-[#1A1A1A]/80 transition-colors"
              >
                Emotional Honesty
              </button>
              <button
                type="button"
                onClick={() => setIntention('Firm 6:30 PM digital boundaries and restorative evening reading.')}
                className="px-2 py-0.5 bg-white border border-[#1A1A1A]/15 hover:border-[#1A1A1A] text-[#1A1A1A]/80 transition-colors"
              >
                Digital Boundaries
              </button>
              <button
                type="button"
                onClick={() => setIntention('One day at a time: mindful presence and continuous self-compassion.')}
                className="px-2 py-0.5 bg-white border border-[#1A1A1A]/15 hover:border-[#1A1A1A] text-[#1A1A1A]/80 transition-colors"
              >
                Mindful Recovery
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-bio-textarea"
              className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
            >
              Folio Biography &amp; Context
            </label>
            <textarea
              id="profile-bio-textarea"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A few words about your background, creative projects, or reflection themes..."
              className="w-full px-3 py-2 text-sm font-serif bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
            />
          </div>
        </div>

        {/* Section 3: Reflection Milestones & Crisis Support Contact ("Extra") */}
        <div className="bg-[#FAF9F7] border border-[#1A1A1A]/15 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3B5A30]" />
              <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                Journey Milestones &amp; Safety Anchor
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/50">
              Personal Markers
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Milestone Date */}
            <div className="space-y-1.5">
              <label
                htmlFor="profile-milestone-date-input"
                className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
              >
                Journey / Sobriety Milestone Date
              </label>
              <input
                id="profile-milestone-date-input"
                type="date"
                value={sobrietyDate}
                onChange={(e) => setSobrietyDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
              />
              {milestoneDays !== null && (
                <div className="p-2 bg-[#3B5A30]/10 border border-[#3B5A30]/30 text-[#3B5A30] text-xs font-mono flex items-center gap-1.5 mt-2">
                  <Heart className="w-3.5 h-3.5 fill-[#3B5A30]" />
                  <span>
                    🌱 <strong>{milestoneDays} days</strong> of dedicated reflection &amp; journey progress!
                  </span>
                </div>
              )}
            </div>

            {/* Emergency / Trusted Support Contact */}
            <div className="space-y-1.5">
              <label
                htmlFor="profile-support-contact-input"
                className="block text-xs font-mono uppercase tracking-wider font-bold text-[#1A1A1A]"
              >
                Trusted Support / Accountability Partner
              </label>
              <input
                id="profile-support-contact-input"
                type="text"
                value={recoveryContact}
                onChange={(e) => setRecoveryContact(e.target.value)}
                placeholder="e.g. Dr. Martinez (555-0199) or Alex (Sponsor)"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#1A1A1A]/20 focus:border-[#1A1A1A] outline-none text-[#1A1A1A]"
              />
              <p className="text-[10px] font-serif italic text-[#1A1A1A]/60">
                Encrypted in your private Firestore document. Never shared with third parties.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Folio Edition Selection */}
        {editions.length > 0 && onSelectEdition && (
          <div className="bg-[#FAF9F7] border border-[#1A1A1A]/15 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A1A1A]/10 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8C271E]" />
                <h2 className="font-serif font-bold text-base text-[#1A1A1A]">
                  Active Journal Edition Preference
                </h2>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#1A1A1A]/50">
                Editorial Folio
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {editions.map((ed) => {
                const isCurrent = ed.id === activeEditionId;
                return (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => onSelectEdition(ed.id)}
                    className={`p-3 text-left border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-white border-[#1A1A1A] ring-1 ring-[#1A1A1A] shadow-xs'
                        : 'bg-white/60 border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#1A1A1A]/60 mb-1">
                      <span>{ed.issueNumber}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 bg-[#1A1A1A] text-white uppercase text-[8px] font-bold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="font-serif font-bold text-xs text-[#1A1A1A] truncate">{ed.title}</p>
                    <p className="text-[10px] font-mono text-[#1A1A1A]/50 truncate mt-0.5">{ed.period}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 5: Security & Isolation Badge */}
        <div className="p-4 bg-white border border-[#1A1A1A]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-[#3B5A30]">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block">
                Cryptographically Isolated Cloud Profile
              </span>
              <span className="text-[11px] text-[#1A1A1A]/60 font-serif italic block">
                Stored in Firestore at <code className="font-mono">/users/{currentUser.uid}</code> with owner-only access rules.
              </span>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('security')}
              className="px-3 py-1.5 bg-[#FAF9F7] hover:bg-[#F2EFE9] border border-[#1A1A1A]/20 text-[10px] uppercase tracking-wider font-bold text-[#1A1A1A] transition-colors cursor-pointer"
            >
              View Security Ledger ➔
            </button>
          )}
        </div>

        {/* Form Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A]/15">
          <button
            type="button"
            onClick={() => {
              setDisplayName(currentUser.displayName || '');
              setPhotoURL(currentUser.photoURL || '');
              setBio(currentUser.bio || '');
              setRole(currentUser.role || 'Private Journaler');
              setPronouns(currentUser.pronouns || '');
              setIntention(currentUser.intention || '');
              setSobrietyDate(currentUser.sobrietyDate || '');
              setRecoveryContact(currentUser.recoveryContact || '');
            }}
            className="px-4 py-2 bg-white border border-[#1A1A1A]/20 hover:border-[#1A1A1A] text-xs font-mono uppercase tracking-wider text-[#1A1A1A] transition-colors shadow-2xs cursor-pointer"
          >
            Reset Form
          </button>

          <button
            id="profile-save-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono uppercase tracking-[0.15em] font-bold shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
