import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { user } from '../../db/schema';
import { ApiError, NotFoundError, ValidationError } from '../../types/api';
import type { UpdateProfileRequest, Profile } from './model';

export abstract class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<Profile> {
    try {
      const userRecord = await db
        .select({
          id: user.id,
          name: user.name,
          image: user.image,
          createdAt: user.createdAt
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!userRecord[0]) {
        throw new NotFoundError('User');
      }

      return {
        id: userRecord[0].id,
        name: userRecord[0].name,
        image: userRecord[0].image || undefined,
        createdAt: userRecord[0].createdAt.toISOString()
      };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      console.error('Error fetching user profile:', error);
      throw new ApiError('Failed to fetch user profile');
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string, 
    updates: UpdateProfileRequest
  ): Promise<Profile> {
    try {
      // Validate that user exists
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!existingUser[0]) {
        throw new NotFoundError('User');
      }

      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      // Perform update
      await db
        .update(user)
        .set(updateData)
        .where(eq(user.id, userId));

      // Return updated profile
      return await this.getProfile(userId);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      console.error('Error updating user profile:', error);
      throw new ApiError('Failed to update user profile');
    }
  }

  /**
   * Validate email format (additional validation beyond schema)
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one digit');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if user exists by email
   */
  static async getUserByEmail(email: string): Promise<boolean> {
    try {
      const existingUser = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      return existingUser.length > 0;
    } catch (error) {
      console.error('Error checking user by email:', error);
      throw new ApiError('Failed to check user existence');
    }
  }

  /**
   * Sanitize user input
   */
  static sanitizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }
}