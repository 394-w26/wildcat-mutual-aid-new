import { z } from 'zod';

// Northwestern email validation
export const northwesternEmailSchema = z
  .string()
  .email()
  .refine((email) => email.endsWith('@u.northwestern.edu'), {
    message: 'Email must be a Northwestern University email (@u.northwestern.edu)',
  });

// User schema
export const userSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string(),
  year: z.string(),
  major: z.string(),
  passwordHash: z.string(),
  photoURL: z.string(),
});

export type User = z.infer<typeof userSchema>;

// Signup form validation
export const signupSchema = z.object({
  email: northwesternEmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Name is required'),
  year: z.string().min(1, 'Year is required'),
  major: z.string().min(1, 'Major is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;

// Login form validation
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Request schema
export const requestSchema = z.object({
  requestID: z.string(),
  title: z.string(),
  description: z.string(),
  creatorID: z.string(),
  status: z.enum(['open', 'closed']),
  createdAt: z.number(),
  creatorEmail: z.string(),
  creatorName: z.string(),
  creatorYear: z.string(),
  creatorMajor: z.string(),
  creatorPhotoURL: z.string(),
});

export type Request = z.infer<typeof requestSchema>;

// Request form validation
export const requestFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export type RequestFormData = z.infer<typeof requestFormSchema>;

// Offer schema
export const offerSchema = z.object({
  offerID: z.string(),
  requestID: z.string(),
  helperID: z.string(),
  status: z.enum(['pending', 'accepted', 'declined']),
  createdAt: z.number(),
  helperEmail: z.string(),
  helperName: z.string(),
  helperYear: z.string(),
  helperMajor: z.string(),
  helperPhotoURL: z.string(),
});

export type Offer = z.infer<typeof offerSchema>;

// Notification schema
export const notificationSchema = z.object({
  notificationID: z.string(),
  userID: z.string(),
  offerID: z.string(),
  requestID: z.string(),
  helperID: z.string(),
  helperName: z.string(),
  helperEmail: z.string(),
  helperYear: z.string(),
  helperPhotoURL: z.string(),
  helperMajor: z.string(),
  status: z.enum(['pending', 'accepted', 'declined']),
  createdAt: z.number(),
  read: z.boolean(),
});

export type Notification = z.infer<typeof notificationSchema>;
