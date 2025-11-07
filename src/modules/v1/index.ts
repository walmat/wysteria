import { Elysia } from 'elysia'
import { userController } from './user'

/**
 * API Version 1.0
 *
 * Note: Auth handled by Better Auth at /api/auth/*
 * Auth macro provided by authService (used by modules that need it)
 */
export const v1 = new Elysia({ prefix: '/api/v1', name: 'api.v1' }).use(userController).get(
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
