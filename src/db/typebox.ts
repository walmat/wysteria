/**
 * Drizzle-Typebox Utility Functions
 *
 * Copy-as-is from Elysia documentation
 * @see https://elysiajs.com/integrations/drizzle.html#utility
 * @lastModified 2025-02-04
 */

import { Kind, type TObject } from '@sinclair/typebox'
import type { Table } from 'drizzle-orm'
import { type BuildSchema, createInsertSchema, createSelectSchema } from 'drizzle-typebox'

// Re-export for use in other files
export { createInsertSchema, createSelectSchema } from 'drizzle-typebox'

type Spread<
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | undefined,
> = T extends TObject<infer Fields>
  ? {
      [K in keyof Fields]: Fields[K]
    }
  : T extends Table
    ? Mode extends 'select'
      ? BuildSchema<'select', T['_']['columns'], undefined>['properties']
      : Mode extends 'insert'
        ? BuildSchema<'insert', T['_']['columns'], undefined>['properties']
        : Record<string, never>
    : Record<string, never>

/**
 * Spread a Drizzle schema into a plain object
 */
export const spread = <T extends TObject | Table, Mode extends 'select' | 'insert' | undefined>(
  schema: T,
  mode?: Mode
): Spread<T, Mode> => {
  const newSchema: Record<string, unknown> = {}
  let resolvedTable: TObject

  switch (mode) {
    case 'insert':
    case 'select':
      if (Kind in schema) {
        resolvedTable = schema as TObject
        break
      }

      resolvedTable =
        mode === 'insert'
          ? createInsertSchema(schema as Table)
          : createSelectSchema(schema as Table)

      break

    default:
      if (!(Kind in schema)) throw new Error('Expect a schema')
      resolvedTable = schema as TObject
  }

  for (const key of Object.keys(resolvedTable.properties))
    newSchema[key] = resolvedTable.properties[key]

  return newSchema as Spread<T, Mode>
}

/**
 * Spread a Drizzle Table into a plain object
 *
 * If `mode` is 'insert', the schema will be refined for insert
 * If `mode` is 'select', the schema will be refined for select
 * If `mode` is undefined, the schema will be spread as is, models will need to be refined manually
 */
export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends 'select' | 'insert' | undefined,
>(
  models: T,
  mode?: Mode
): {
  [K in keyof T]: Spread<T[K], Mode>
} => {
  const newSchema: Record<string, unknown> = {}
  const keys = Object.keys(models)

  for (const key of keys) newSchema[key] = spread(models[key], mode)

  return newSchema as any
}
