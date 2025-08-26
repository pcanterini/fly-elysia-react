import { t } from 'elysia';

export const UserModel = {
  // User response model
  user: t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String({ format: 'email' }),
    emailVerified: t.Boolean(),
    image: t.Optional(t.String({ format: 'uri' })),
    createdAt: t.String({ format: 'date-time' }),
    updatedAt: t.String({ format: 'date-time' })
  }),

  // Profile response model (excludes sensitive data)
  profile: t.Object({
    id: t.String(),
    name: t.String(),
    image: t.Optional(t.String({ format: 'uri' })),
    createdAt: t.String({ format: 'date-time' })
  }),

  // Update profile request
  updateProfile: t.Object({
    name: t.Optional(t.String({ 
      minLength: 1, 
      maxLength: 100,
      error: 'Name must be between 1 and 100 characters'
    })),
    image: t.Optional(t.String({ 
      format: 'uri',
      error: 'Image must be a valid URL'
    }))
  }),

  // Change password request
  changePassword: t.Object({
    currentPassword: t.String({ 
      minLength: 1,
      error: 'Current password is required'
    }),
    newPassword: t.String({ 
      minLength: 8, 
      maxLength: 128,
      error: 'New password must be between 8 and 128 characters'
    }),
    revokeOtherSessions: t.Optional(t.Boolean())
  }),

  // User list response
  userList: t.Object({
    users: t.Array(t.Ref('profile')),
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    hasMore: t.Boolean()
  })
};

// Type exports for TypeScript
export type User = typeof UserModel.user.static;
export type Profile = typeof UserModel.profile.static;
export type UpdateProfileRequest = typeof UserModel.updateProfile.static;
export type ChangePasswordRequest = typeof UserModel.changePassword.static;