import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signupSchema, loginSchema, northwesternEmailSchema } from '../types/index';

describe('Authentication Schema Validation', () => {
  describe('Northwestern Email Validation', () => {
    it('should accept valid northwestern emails', () => {
      const result = northwesternEmailSchema.safeParse('student@u.northwestern.edu');
      expect(result.success).toBe(true);
    });

    it('should reject signup without @u.northwestern.edu email', () => {
      const result = northwesternEmailSchema.safeParse('student@gmail.com');
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Northwestern University email');
    });

    it('should reject other northwestern domain emails', () => {
      const result = northwesternEmailSchema.safeParse('student@northwestern.edu');
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('Northwestern University email');
    });
  });

  describe('Signup Schema Validation', () => {
    it('should accept valid signup data', () => {
      const result = signupSchema.safeParse({
        email: 'student@u.northwestern.edu',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'John Doe',
        year: 'Sophomore',
        major: 'Computer Science',
      });
      expect(result.success).toBe(true);
    });

    it('should reject signup with non-northwestern email', () => {
      const result = signupSchema.safeParse({
        email: 'student@gmail.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'John Doe',
        year: 'Sophomore',
        major: 'Computer Science',
      });
      expect(result.success).toBe(false);
    });

    it('should reject password shorter than 6 characters', () => {
      const result = signupSchema.safeParse({
        email: 'student@u.northwestern.edu',
        password: 'pass',
        confirmPassword: 'pass',
        name: 'John Doe',
        year: 'Sophomore',
        major: 'Computer Science',
      });
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const result = signupSchema.safeParse({
        email: 'student@u.northwestern.edu',
        password: 'password123',
        confirmPassword: 'password456',
        name: 'John Doe',
        year: 'Sophomore',
        major: 'Computer Science',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema Validation', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'student@u.northwestern.edu',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should require email', () => {
      const result = loginSchema.safeParse({
        email: '',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should require password', () => {
      const result = loginSchema.safeParse({
        email: 'student@u.northwestern.edu',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Authentication Functions', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should reject login with incorrect password', async () => {
    // Dynamically import to get fresh state
    const { signup, login } = await import('../utilities/auth');

    // First sign up
    await signup({
      email: 'testuser@u.northwestern.edu',
      password: 'correctpassword',
      confirmPassword: 'correctpassword',
      name: 'Test User',
      year: 'Sophomore',
      major: 'CS',
    });

    // Then try to login with wrong password
    try {
      await login({
        email: 'testuser@u.northwestern.edu',
        password: 'wrongpassword',
      });
      expect.fail('Should have thrown error for incorrect password');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Incorrect password');
    }
  });

  it('should have offer creation trigger a notification', async () => {
    const { createOffer, createNotification } = await import('../utilities/database');

    // Create an offer
    const offer = createOffer(
      'req_123',
      'helper_123',
      'helper@u.northwestern.edu',
      'Helper Name'
    );

    expect(offer).toBeDefined();
    expect(offer.status).toBe('pending');

    // Create notification from the offer
    const notification = createNotification(
      'requester_123',
      offer.offerID,
      'req_123',
      'helper_123',
      'Helper Name',
      'helper@u.northwestern.edu',
      'Junior',
      'Computer Science',
      'pending'
    );

    expect(notification).toBeDefined();
    expect(notification.read).toBe(false);
    expect(notification.helperName).toBe('Helper Name');
    expect(notification.helperYear).toBe('Junior');
    expect(notification.helperMajor).toBe('Computer Science');
  });
});

describe('Database Functions', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should create and retrieve requests', async () => {
    const { createRequest, getRequest, getAllRequests } = await import('../utilities/database');

    const request = await createRequest(
      'Need a ride',
      'I need a ride to HMart',
      'user_123',
      'user@u.northwestern.edu',
      'User Name',
      'Sophomore',
      'Computer Science'
    );

    expect(request).toBeDefined();
    expect(request.status).toBe('open');
    expect(request.title).toBe('Need a ride');

    const retrieved = getRequest(request.requestID);
    expect(retrieved).toEqual(request);

    const allRequests = getAllRequests();
    expect(allRequests).toContain(request);
  });

  it('should create and retrieve offers', async () => {
    const { createOffer, getOffer } = await import('../utilities/database');

    const offer = createOffer(
      'req_123',
      'helper_123',
      'helper@u.northwestern.edu',
      'Helper'
    );

    expect(offer).toBeDefined();
    expect(offer.status).toBe('pending');

    const retrieved = getOffer(offer.offerID);
    expect(retrieved).toEqual(offer);
  });

  it('should create and retrieve notifications', async () => {
    const { createNotification, getNotification, getNotificationsByUser } = await import('../utilities/database');

    const notification = createNotification(
      'user_123',
      'offer_123',
      'req_123',
      'helper_123',
      'Helper Name',
      'helper@u.northwestern.edu',
      'Junior',
      'Computer Science',
      'pending'
    );

    expect(notification).toBeDefined();
    expect(notification.read).toBe(false);

    const retrieved = getNotification(notification.notificationID);
    expect(retrieved).toEqual(notification);

    const userNotifications = getNotificationsByUser('user_123');
    expect(userNotifications).toContain(notification);
  });
});
