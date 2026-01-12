import { hash, compare } from 'bcryptjs';
import type { User, SignupFormData, LoginFormData } from '../types/index';
import { signupSchema, loginSchema } from '../types/index';

// Simple in-memory user storage for local development
// In production, this would use Firebase Realtime Database
const users: Map<string, User> = new Map();

export const signup = async (data: SignupFormData): Promise<User> => {
  try {
    // Validate input
    const validated = signupSchema.parse(data);

    // Check if email already exists
    if (Array.from(users.values()).some((u) => u.email === validated.email)) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hash(validated.password, 10);

    // Create user
    const uid = `user_${Date.now()}`;
    const user: User = {
      uid,
      email: validated.email,
      name: validated.name,
      year: validated.year,
      major: validated.major,
      passwordHash,
    };

    // Store user
    users.set(uid, user);

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
    throw error;
  }
};

export const login = async (data: LoginFormData): Promise<User> => {
  try {
    // Validate input
    const validated = loginSchema.parse(data);

    // Find user by email
    let user: User | undefined;
    for (const u of users.values()) {
      if (u.email === validated.email) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new Error('Email not found');
    }

    // Compare password
    const passwordMatch = await compare(validated.password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('Incorrect password');
    }

    return user;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Login failed: ${error.message}`);
    }
    throw error;
  }
};

export const getUserByEmail = (email: string): User | undefined => {
  for (const user of users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return undefined;
};

export const getUserById = (uid: string): User | undefined => {
  return users.get(uid);
};

export const getAllUsers = (): User[] => {
  return Array.from(users.values());
};
