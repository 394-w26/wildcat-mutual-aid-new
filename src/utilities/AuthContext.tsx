import { createContext, useContext, useState, useCallback } from 'react';
import type { PropsWithChildren } from 'react';
import type { User } from '../types/index';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string, name: string, year: string, major: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { login: authLogin } = await import('../utilities/auth');
      const user = await authLogin({ email, password });
      setCurrentUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, confirmPassword: string, name: string, year: string, major: string) => {
    setIsLoading(true);
    try {
      const { signup: authSignup } = await import('../utilities/auth');
      const user = await authSignup({
        email,
        password,
        confirmPassword,
        name,
        year,
        major,
      });
      setCurrentUser(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const value: AuthContextType = {
    currentUser,
    login,
    signup,
    logout,
    isLoading,
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
