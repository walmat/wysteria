/**
 * Centralized Database Models
 *
 * Following Elysia's recommended pattern: Table Singleton
 * @see https://elysiajs.com/integrations/drizzle.html
 *
 * This creates a centralized `db` object with auto-generated Elysia validation
 * schemas from Drizzle tables, ensuring consistency between database and API.
 *
 * @example
 * import { db } from '@server/db/models'
 *
 * // Use in routes
 * const { user } = db.insert
 * body: t.Object({
 *   name: user.name,
 *   email: user.email
 * })
 */

import { t } from 'elysia'
import { table } from './schema'
import { createInsertSchema, spreads } from './typebox'

/**
 * Database validation schemas
 *
 * - `db.insert.*` - Schemas for inserting records (excludes generated fields)
 * - `db.select.*` - Schemas for selecting records (includes all fields)
 *
 * Usage in module models:
 * ```typescript
 * const { user } = db.select
 * export const UserModel = {
 *   user,  // Use directly for responses
 *   create: t.Object({
 *     name: user.name,
 *     email: user.email
 *   })
 * }
 * ```
 */
export const db = {
  insert: spreads(
    {
      // Customize validation for specific fields
      user: createInsertSchema(table.user, {
        email: t.String({ format: 'email' }),
        name: t.String({ minLength: 1, maxLength: 100 }),
      }),
      session: table.session,
      account: table.account,
      verification: table.verification,
    },
    'insert'
  ),
  select: spreads(
    {
      user: table.user,
      session: table.session,
      account: table.account,
      verification: table.verification,
    },
    'select'
  ),
} as const

// Export types for TypeScript
export type DbInsert = typeof db.insert
export type DbSelect = typeof db.select

// Re-export utilities for creating custom schemas in modules
export { createInsertSchema, createSelectSchema, spread, spreads } from './typebox'
