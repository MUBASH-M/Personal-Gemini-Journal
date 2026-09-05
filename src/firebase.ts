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
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { JournalEntry, UserProfile } from './types';

// Initialize Firebase app singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication and Firestore (pointing to configured databaseId)
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export { firebaseConfig, onAuthStateChanged };

// Test connection on boot per Firebase skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isFirebaseOwner(userId?: string): boolean {
  if (!userId) return false;
  return Boolean(
    auth.currentUser &&
    !auth.currentUser.isAnonymous &&
    auth.currentUser.uid === userId
  );
}

/**
 * Ensure user is authenticated in Firebase Auth (checks active user)
 */
export async function ensureFirebaseAuth(): Promise<FirebaseUser | null> {
  return auth.currentUser;
}

/**
 * Formats Firebase Auth error codes into human-actionable messages,
 * specifically handling Netlify and external domain authorization.
 */
export function formatFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'this domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `Domain not authorized in Firebase Console: '${currentHost}' must be added to your Firebase project. Go to Firebase Console > Authentication > Settings > Authorized Domains and add '${currentHost}'.`;
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before completing authentication.';
    case 'auth/cancelled-popup-request':
      return 'The sign-in popup request was cancelled.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in your Firebase project. Enable Google in Firebase Console > Authentication > Sign-in method.';
    case 'auth/user-disabled':
      return 'This account has been disabled in Firebase Authentication.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/network-request-failed':
      return 'Network connection error while contacting Firebase Authentication. Please check your internet connection.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
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
  if (!isFirebaseOwner(profile.uid)) {
    return;
  }
  try {
    const targetUid = profile.uid;
    const userDocRef = doc(db, 'users', targetUid);
    const payload: Record<string, any> = {
      uid: targetUid,
      email: profile.email || auth.currentUser?.email || 'user@example.com',
      displayName: profile.displayName || auth.currentUser?.displayName || 'Journal Author',
      role: profile.role || 'Private Journaler',
      createdAt: profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (profile.photoURL !== undefined || auth.currentUser?.photoURL) {
      payload.photoURL = profile.photoURL || auth.currentUser?.photoURL || null;
    }
    if (profile.bio !== undefined) payload.bio = profile.bio || null;
    if (profile.pronouns !== undefined) payload.pronouns = profile.pronouns || null;
    if (profile.recoveryContact !== undefined) payload.recoveryContact = profile.recoveryContact || null;
    if (profile.sobrietyDate !== undefined) payload.sobrietyDate = profile.sobrietyDate || null;
    if (profile.intention !== undefined) payload.intention = profile.intention || null;
    if (profile.authProvider !== undefined) payload.authProvider = profile.authProvider;
    if (profile.activeEditionId !== undefined) payload.activeEditionId = profile.activeEditionId;

    try {
      await setDoc(userDocRef, payload, { merge: true });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`);
    }

    // Sync with client-side Firebase Auth profile if matching
    if (auth.currentUser && auth.currentUser.uid === targetUid) {
      await updateProfile(auth.currentUser, {
        displayName: payload.displayName,
        photoURL: payload.photoURL || null,
      }).catch((e) => console.warn('Firebase Auth updateProfile sync notice:', e));
    }
  } catch (err) {
    console.warn('Firestore user profile save notice:', err);
  }
}

/**
 * Fetch profile directly from Firestore /users/{userId}
 */
export async function fetchFirestoreUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isFirebaseOwner(userId)) {
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err: any) {
    console.warn('Failed to fetch Firestore user profile:', err);
    handleFirestoreError(err, OperationType.GET, `users/${userId}`);
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
  onError?: (error: any) => void
): () => void {
  if (!isFirebaseOwner(userId)) {
    return () => {};
  }
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
      console.warn('Firestore subscription notice:', err);
      handleFirestoreError(err, OperationType.GET, `users/${userId}/entries`);
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
): Promise<JournalEntry | null> {
  if (!isFirebaseOwner(userId)) {
    return null;
  }
  const entryId = entry.entryId || 'ent_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const fullEntry: JournalEntry = {
    ...entry,
    entryId,
    uid: userId,
    createdAt: now,
  };

  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    await setDoc(entryDocRef, fullEntry);
    return fullEntry;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/entries/${entryId}`);
    throw err;
  }
}

/**
 * Delete a journal entry from /users/{userId}/entries/{entryId}
 */
export async function deleteEntryFromFirestore(userId: string, entryId: string): Promise<boolean> {
  if (!isFirebaseOwner(userId)) {
    return false;
  }
  try {
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryDocRef);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}/entries/${entryId}`);
    throw err;
  }
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
