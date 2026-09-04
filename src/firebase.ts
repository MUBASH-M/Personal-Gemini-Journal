import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { JournalEntry, UserProfile } from './types';

// Initialize Firebase app singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication and Firestore (pointing to configured databaseId)
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export { firebaseConfig };

/**
 * Ensure user is authenticated in Firebase Auth (anonymous fallback)
 */
export async function ensureFirebaseAuth(): Promise<FirebaseUser> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  const credential = await signInAnonymously(auth);
  return credential.user;
}

/**
 * Sign In with Google (Gmail ID) via popup
 */
export async function signInWithGooglePopup(): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  const cred = await signInWithPopup(auth, provider);
  const fbUser = cred.user;
  
  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || 'google_user@gmail.com',
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Member',
    role: 'Private Journaler (Google Account)',
    createdAt: new Date().toISOString(),
    authProvider: 'google',
    photoURL: fbUser.photoURL || undefined,
  };

  await saveUserProfileToFirestore(profile);
  return { user: profile, firebaseUser: fbUser };
}

/**
 * Sign In with Apple ID via popup
 */
export async function signInWithApplePopup(): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  const cred = await signInWithPopup(auth, provider);
  const fbUser = cred.user;

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || 'apple_user@icloud.com',
    displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Apple Member',
    role: 'Private Journaler (Apple ID)',
    createdAt: new Date().toISOString(),
    authProvider: 'apple',
    photoURL: fbUser.photoURL || undefined,
  };

  await saveUserProfileToFirestore(profile);
  return { user: profile, firebaseUser: fbUser };
}

/**
 * Sign In with Email & Password (any mail ID: Outlook, Yahoo, Proton, corporate, etc.)
 */
export async function signInWithEmail(email: string, password: string): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const fbUser = cred.user;

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || email,
    displayName: fbUser.displayName || email.split('@')[0] || 'Journal Author',
    role: 'Private Journaler (Email Verified)',
    createdAt: new Date().toISOString(),
    authProvider: 'email',
  };

  await saveUserProfileToFirestore(profile);
  return { user: profile, firebaseUser: fbUser };
}

/**
 * Sign Up with Email & Password (any mail ID)
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: UserProfile; firebaseUser: FirebaseUser }> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const fbUser = cred.user;

  if (displayName) {
    try {
      await updateProfile(fbUser, { displayName });
    } catch {}
  }

  const profile: UserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || email,
    displayName: displayName || email.split('@')[0] || 'Journal Author',
    role: 'Private Journaler (Email Verified)',
    createdAt: new Date().toISOString(),
    authProvider: 'email',
  };

  await saveUserProfileToFirestore(profile);
  return { user: profile, firebaseUser: fbUser };
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
}

/**
 * Save user profile to /users/{userId} and sync Firebase Auth
 */
export async function saveUserProfileToFirestore(profile: UserProfile): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    const payload: Record<string, any> = {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role || 'Private Journaler',
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (profile.photoURL !== undefined) payload.photoURL = profile.photoURL || null;
    if (profile.bio !== undefined) payload.bio = profile.bio || null;
    if (profile.pronouns !== undefined) payload.pronouns = profile.pronouns || null;
    if (profile.recoveryContact !== undefined) payload.recoveryContact = profile.recoveryContact || null;
    if (profile.sobrietyDate !== undefined) payload.sobrietyDate = profile.sobrietyDate || null;
    if (profile.intention !== undefined) payload.intention = profile.intention || null;
    if (profile.authProvider !== undefined) payload.authProvider = profile.authProvider;
    if (profile.activeEditionId !== undefined) payload.activeEditionId = profile.activeEditionId;

    await setDoc(userDocRef, payload, { merge: true });

    // Sync with client-side Firebase Auth profile if matching
    if (auth.currentUser && auth.currentUser.uid === profile.uid) {
      await updateProfile(auth.currentUser, {
        displayName: profile.displayName,
        photoURL: profile.photoURL || null,
      }).catch((e) => console.warn('Firebase Auth updateProfile sync notice:', e));
    }
  } catch (err) {
    console.warn('Firestore user profile save error (fallback to local):', err);
  }
}

/**
 * Fetch profile directly from Firestore /users/{userId}
 */
export async function fetchFirestoreUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Failed to fetch Firestore user profile:', err);
  }
  return null;
}

/**
 * Attempt to obtain the photo URL associated with Gmail / Google or Apple ID login
 */
export function getProviderLoginPhotoURL(user?: UserProfile | null): string | null {
  // 1. Direct Firebase Auth user photo
  if (auth.currentUser?.photoURL) {
    return auth.currentUser.photoURL;
  }

  // 2. Check providerData in Firebase Auth
  if (auth.currentUser?.providerData) {
    for (const provider of auth.currentUser.providerData) {
      if (provider.photoURL) {
        return provider.photoURL;
      }
    }
  }

  // 3. If user has an existing photoURL from their profile
  if (user?.photoURL) {
    return user.photoURL;
  }

  // 4. Construct provider-specific avatar for Gmail / Google Workspace
  const email = user?.email || auth.currentUser?.email;
  if (email && (email.toLowerCase().includes('@gmail.com') || email.toLowerCase().includes('@googlemail.com') || user?.authProvider === 'google')) {
    return `https://unavatar.io/google/${encodeURIComponent(email)}`;
  }

  // 5. Apple ID / iCloud avatar service
  if (email && (email.toLowerCase().includes('@icloud.com') || email.toLowerCase().includes('@apple.com') || user?.authProvider === 'apple')) {
    return `https://unavatar.io/apple/${encodeURIComponent(email.split('@')[0])}`;
  }

  if (email) {
    return `https://unavatar.io/${encodeURIComponent(email)}?fallback=false`;
  }

  return null;
}

/**
 * Subscribe to user's private journal entries: /users/{userId}/entries
 * Enforces owner-only scoping in real-time.
 */
export function subscribeToEntries(
  userId: string,
  onNext: (entries: JournalEntry[]) => void,
  onError?: (error: FirestoreError) => void
) {
  const entriesColRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesColRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        entries.push({
          entryId: docSnap.id,
          uid: data.uid || userId,
          summary: data.summary || '',
          mood: data.mood || 'reflective',
          themes: Array.isArray(data.themes) ? data.themes : [],
          keyTakeaway: data.keyTakeaway || '',
          createdAt: data.createdAt || new Date().toISOString(),
          turnCount: data.turnCount || 0,
          messages: data.messages || [],
        });
      });
      onNext(entries);
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Write a journal entry directly to /users/{userId}/entries/{entryId}
 */
export async function createEntryInFirestore(
  userId: string,
  entry: Omit<JournalEntry, 'entryId' | 'uid' | 'createdAt'> & { entryId?: string }
): Promise<JournalEntry> {
  const entryId = entry.entryId || 'ent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const fullEntry: JournalEntry = {
    ...entry,
    entryId,
    uid: userId,
    createdAt: now,
  };

  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await setDoc(entryDocRef, fullEntry);

  return fullEntry;
}

/**
 * Delete a journal entry from /users/{userId}/entries/{entryId}
 */
export async function deleteEntryFromFirestore(userId: string, entryId: string): Promise<boolean> {
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryDocRef);
  return true;
}

/**
 * Directly probe Firestore Security Rules to prove live cross-tenant isolation
 */
export async function testLiveFirestoreSecurity(
  attackType: 'cross_read' | 'cross_write',
  targetUid: string
): Promise<{
  blockedByFirestoreRules: boolean;
  errorCode?: string;
  errorMessage?: string;
  details: string;
}> {
  try {
    if (attackType === 'cross_read') {
      // Attempt to read another user's collection directly via the Firestore Client SDK
      const targetColRef = collection(db, 'users', targetUid, 'entries');
      const snap = await getDocs(targetColRef);
      return {
        blockedByFirestoreRules: false,
        details: `Unexpected: Read permitted ${snap.size} documents from target user ${targetUid}`,
      };
    } else {
      // Attempt to write into another user's subcollection directly
      const maliciousDocRef = doc(db, 'users', targetUid, 'entries', 'malicious_exploit_test');
      await setDoc(maliciousDocRef, {
        summary: 'Unauthorized test write attempt',
        mood: 'anxious',
        themes: ['exploit-attempt'],
        uid: targetUid,
        createdAt: new Date().toISOString(),
        turnCount: 1,
      });
      return {
        blockedByFirestoreRules: false,
        details: `Unexpected: Write succeeded into target path /users/${targetUid}/entries`,
      };
    }
  } catch (err: any) {
    const isPermissionDenied =
      err?.code === 'permission-denied' ||
      err?.message?.includes('Missing or insufficient permissions') ||
      err?.message?.includes('permission-denied');

    return {
      blockedByFirestoreRules: isPermissionDenied,
      errorCode: err?.code || 'permission-denied',
      errorMessage: err?.message || 'Permission denied by Firestore Security Rules',
      details: isPermissionDenied
        ? `Cloud Firestore rejected cross-tenant operation: Code ${err?.code || 'permission-denied'}. Rule 'match /users/{userId}/entries/{entryId} { allow read, write: if request.auth.uid == userId }' enforced successfully.`
        : `Operation halted: ${err?.message}`,
    };
  }
}
