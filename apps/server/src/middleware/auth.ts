import { Elysia } from 'elysia';
import { auth } from '../auth/config';

/**
 * Middleware to require authentication for protected routes
 * Validates session and adds userId to context
 */
export const requireAuth = new Elysia({ name: 'auth-middleware' })
  .derive(
    { as: 'global' }, // Make the derived context available globally
    async ({ request, set, headers }) => {
      console.log('[Auth Middleware] Checking authentication...');
      
      try {
        // Get session from better-auth
        const sessionResponse = await auth.api.getSession({
          headers: new Headers(Object.entries(headers).filter(([_, v]) => v !== undefined) as [string, string][]),
        });
        
        if (!sessionResponse?.session || !sessionResponse?.user) {
          console.log('[Auth Middleware] No valid session');
          return {
            authenticated: false as const,
            userId: null as string | null,
            user: null,
            session: null
          };
        }

        console.log('[Auth Middleware] Authenticated user:', sessionResponse.user.id);
        // Return authenticated context
        return {
          authenticated: true as const,
          userId: sessionResponse.user.id,
          user: sessionResponse.user,
          session: sessionResponse.session
        };
      } catch (error) {
        console.error('[Auth Middleware] Error:', error);
        return {
          authenticated: false as const,
          userId: null as string | null,
          user: null,
          session: null
        };
      }
    }
  )
  .onBeforeHandle(({ authenticated, set, userId }) => {
    console.log('[Auth Middleware] onBeforeHandle - authenticated:', authenticated, 'userId:', userId);
    
    // Block request if not authenticated
    if (!authenticated || !userId) {
      set.status = 401;
      return {
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      };
    }
  });

/**
 * Optional auth middleware - adds user context if authenticated but doesn't require it
 */
export const optionalAuth = new Elysia({ name: 'optional-auth-middleware' })
  .derive(async ({ request, headers }) => {
    try {
      const sessionResponse = await auth.api.getSession({
        headers: new Headers(Object.entries(headers).filter(([_, v]) => v !== undefined) as [string, string][]),
      });

      if (sessionResponse?.session && sessionResponse?.user) {
        return {
          userId: sessionResponse.user.id,
          user: sessionResponse.user,
          session: sessionResponse.session,
          authenticated: true as const
        };
      }
    } catch (error) {
      // Silent fail for optional auth
    }

    // Return null values if not authenticated
    return {
      userId: null,
      user: null,
      session: null,
      authenticated: false as const
    };
  });