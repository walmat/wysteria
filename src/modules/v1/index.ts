import { Elysia } from 'elysia'

/**
 * API Version 1.0
 *
 * All authentication is handled by Better Auth at /api/auth/*
 * Use the authService macro for protected routes when needed.
 */
export const v1 = new Elysia({ prefix: '/api/v1', name: 'api.v1' }).get(
  '/health',
  () => ({
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
  }),
  {
    detail: {
      summary: 'Health check',
      tags: ['System'],
    },
  }
)
