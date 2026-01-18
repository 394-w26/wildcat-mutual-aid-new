import { createContext, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getUserProfile } from './database';

interface AuthContextType {
  currentUser: User | null;
  login: () => Promise<User | null>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateProfile: (profile: { name: string; year: string; major: string }) => void;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    try {
      setIsLoading(true);
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);

      // Set the current user with Firebase user data
      const firebaseUser = {
        uid: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || undefined,
      };

      // Fetch profile if exists
      const profile = await getUserProfile(result.user.uid);
      const currentUser = {
        ...firebaseUser,
        name: profile?.name || firebaseUser.displayName,
        year: profile?.year,
        major: profile?.major,
      };

      setCurrentUser(currentUser);
      return currentUser;
    } catch (err) {
      console.error('error signing in');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (profile: { name: string; year: string; major: string }) => {
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
