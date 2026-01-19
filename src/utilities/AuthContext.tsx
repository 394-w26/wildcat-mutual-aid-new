import { createContext, useContext, useState, useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getUserProfile } from './database';

interface AuthContextType {
  currentUser: User | null;
  login: () => Promise<User | null>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateProfile: (profile: {
    name: string;
    year: string;
    major: string;
    photoURL: string;
  }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  name?: string;
  year?: string;
  major?: string;
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [firebaseUser, firebaseLoading] = useAuthState(auth);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Firebase auth state with currentUser
  useEffect(() => {
    let isActive = true;
    const syncUser = async () => {
      setIsLoading(true);
      try {
        if (!firebaseUser) {
          if (isActive) setCurrentUser(null);
          return;
        }

        const email = firebaseUser.email || '';
        if (!isAllowedEmail(email)) {
          await signOut(auth);
          if (isActive) setCurrentUser(null);
          return;
        }

        const profile = await getUserProfile(firebaseUser.uid);
        const user: User = {
          uid: firebaseUser.uid,
          email,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || undefined,
          year: profile?.year,
          major: profile?.major,
        };
        if (isActive) setCurrentUser(user);
      } catch (error) {
        console.error('Failed to sync user', error);
        if (isActive) setCurrentUser(null);
      } finally {
        if (isActive) setIsLoading(firebaseLoading);
      }
    };
    syncUser();
    return () => {
      isActive = false;
    };
  }, [firebaseUser, firebaseLoading]);
// ...existing code...

  const ALLOWED_EMAIL_DOMAINS = ['u.northwestern.edu', 'northwestern.edu'];

  const isAllowedEmail = (email?: string) => {
    if (!email) return false;
    return ALLOWED_EMAIL_DOMAINS.some((domain) =>
      email.toLowerCase().endsWith(`@${domain}`)
    );
  };

  const login = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);

      const email = result.user.email || '';
      if (!isAllowedEmail(email)) {
        await signOut(auth);
        throw new Error('Please sign in with a Northwestern email address.');
      }

      // Set the current user with Firebase user data
      const firebaseUserData = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
      };

      // Fetch profile if exists
      const profile = await getUserProfile(result.user.uid);
      const user: User = {
        ...firebaseUserData,
        name: profile?.name || firebaseUserData.displayName,
        year: profile?.year,
        major: profile?.major,
      };

      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('error signing in');
      throw err instanceof Error ? err : new Error('Login failed');
    }
  };

  const updateProfile = (profile: {
    name: string;
    year: string;
    major: string;
    photoURL: string;
  }) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...profile });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const value: AuthContextType = {
    currentUser,
    login,
    logout,
    isLoading,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
