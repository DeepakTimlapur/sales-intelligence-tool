import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as fbSignOut
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  setError: (err: string | null) => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateTokenBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync or create initial user profile document in Firestore
  const syncUserProfile = async (fbUser: FirebaseUser, fallbackName?: string): Promise<UserProfile> => {
    const userRef = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existingData = snap.data() as UserProfile;
      return existingData;
    } else {
      const now = new Date().toISOString();
      const initialProfile: UserProfile = {
        uid: fbUser.uid,
        name: fallbackName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Sales Pro',
        email: fbUser.email || '',
        photoURL: fbUser.photoURL || '',
        plan: 'free',
        tokenBalance: 1000,
        subscriptionStatus: 'free',
        monthlyTokenAllocation: null,
        trialStartDate: null,
        trialEndDate: null,
        hasUsedTrial: false,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        billingCycle: null,
        paymentProvider: null,
        paymentCustomerId: null,
        paymentSubscriptionId: null,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userRef, initialProfile);
      return initialProfile;
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      setError(null);

      if (fbUser) {
        setProfileLoading(true);
        try {
          // Ensure document exists
          await syncUserProfile(fbUser);

          // Real-time listener on the user's profile document
          const userRef = doc(db, 'users', fbUser.uid);
          unsubscribeProfile = onSnapshot(
            userRef,
            (docSnap) => {
              if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
              }
              setProfileLoading(false);
            },
            (err) => {
              console.error('Firestore user profile listener error:', err);
              setError('Failed to sync user profile. Please check connection.');
              setProfileLoading(false);
            }
          );
        } catch (err: any) {
          console.error('Failed to initialize user document:', err);
          setError(err.message || 'Error initializing user account in Firestore.');
          setProfileLoading(false);
        }
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please log in instead.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please provide a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in popup was closed before completion.';
      case 'auth/popup-blocked':
        return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/operation-not-allowed':
        return 'Sign-in method is currently disabled in Firebase console.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a few moments and try again.';
      default:
        return err.message || 'Authentication error. Please try again.';
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.error('Email Sign-In error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      await syncUserProfile(result.user, name.trim());
    } catch (err: any) {
      console.error('Email Sign-Up error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await fbSignOut(auth);
      setProfile(null);
      setUser(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message || 'Failed to logout');
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  const updateTokenBalance = (newBalance: number) => {
    setProfile(prev => (prev ? { ...prev, tokenBalance: newBalance } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        error,
        setError,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        refreshProfile,
        updateTokenBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
