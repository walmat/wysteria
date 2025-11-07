import * as authSchema from './auth-schema'

// Export individual tables for Drizzle relational queries
export const { user, session, account, verification } = authSchema

// Export as table object for drizzle-typebox
export const table = {
  ...authSchema,
} as const

export type Table = typeof table
