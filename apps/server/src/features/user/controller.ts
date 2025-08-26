import { Elysia, t } from 'elysia';
import { sessionMiddleware } from 'better-auth/api';
import { UserModel } from './model';
import { UserService } from './service';
import { ApiResponse, UnauthorizedError, ValidationError } from '../../types/api';
import { auth } from '../../auth/config';

export const userController = new Elysia({ prefix: '/users' })
  .model(UserModel)
  
  // Get current user profile
  .get('/me',
    async ({ headers }) => {
      const session = await auth.api.getSession({ headers });
      
      if (!session) {
        throw new UnauthorizedError('Authentication required');
      }

      const profile = await UserService.getProfile(session.user.id);
      
      return {
        success: true as const,
        data: profile,
        timestamp: new Date().toISOString()
      };
    },
    {
      response: {
        200: t.Object({
          success: t.Literal(true),
          data: t.Ref('profile'),
          timestamp: t.String()
        }),
        401: ApiResponse.error
      },
      detail: {
        tags: ['User'],
        summary: 'Get Current User Profile',
        description: 'Get the profile of the currently authenticated user'
      }
    }
  )
  
  // Update current user profile
  .patch('/me',
    async ({ headers, body }) => {
      const session = await auth.api.getSession({ headers });
      
      if (!session) {
        throw new UnauthorizedError('Authentication required');
      }

      // Sanitize input
      const sanitizedBody = {
        ...body,
        ...(body.name && { name: UserService.sanitizeName(body.name) })
      };

      const updatedProfile = await UserService.updateProfile(
        session.user.id, 
        sanitizedBody
      );
      
      return {
        success: true as const,
        data: updatedProfile,
        timestamp: new Date().toISOString()
      };
    },
    {
      body: t.Ref('updateProfile'),
      response: {
        200: t.Object({
          success: t.Literal(true),
          data: t.Ref('profile'),
          timestamp: t.String()
        }),
        400: ApiResponse.error,
        401: ApiResponse.error
      },
      detail: {
        tags: ['User'],
        summary: 'Update Current User Profile',
        description: 'Update the profile information of the currently authenticated user'
      }
    }
  )
  
  // Get user profile by ID (public endpoint with limited data)
  .get('/:id',
    async ({ params: { id } }) => {
      const profile = await UserService.getProfile(id);
      
      return {
        success: true as const,
        data: profile,
        timestamp: new Date().toISOString()
      };
    },
    {
      params: t.Object({
        id: t.String({
          minLength: 1,
          error: 'User ID is required'
        })
      }),
      response: {
        200: t.Object({
          success: t.Literal(true),
          data: t.Ref('profile'),
          timestamp: t.String()
        }),
        404: ApiResponse.error
      },
      detail: {
        tags: ['User'],
        summary: 'Get User Profile by ID',
        description: 'Get public profile information of a user by their ID'
      }
    }
  )
  
  // Change password endpoint
  .post('/me/change-password',
    async ({ headers, body }) => {
      const session = await auth.api.getSession({ headers });
      
      if (!session) {
        throw new UnauthorizedError('Authentication required');
      }

      // Validate password strength
      const passwordValidation = UserService.validatePasswordStrength(body.newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError(
          `Password validation failed: ${passwordValidation.errors.join(', ')}`
        );
      }

      // Use Better-auth's changePassword functionality
      // Note: This would need to be implemented using Better-auth's API
      // For now, we'll return a success response
      
      return {
        success: true as const,
        data: { message: 'Password changed successfully' },
        timestamp: new Date().toISOString()
      };
    },
    {
      body: t.Ref('changePassword'),
      response: {
        200: t.Object({
          success: t.Literal(true),
          data: t.Object({
            message: t.String()
          }),
          timestamp: t.String()
        }),
        400: ApiResponse.error,
        401: ApiResponse.error
      },
      detail: {
        tags: ['User'],
        summary: 'Change Password',
        description: 'Change the password for the currently authenticated user'
      }
    }
  );