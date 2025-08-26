import { Elysia } from 'elysia';
import { auth } from '../auth/config';

export const authRoutes = new Elysia()
  .mount('/api/auth', auth.handler);