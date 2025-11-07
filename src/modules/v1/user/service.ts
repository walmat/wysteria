import { db } from '@server/db'
import * as schema from '@server/db/schema'
import { eq } from 'drizzle-orm'

export abstract class User {
  static async getUserById(id: string) {
    return await db.query.user.findFirst({ where: eq(schema.user.id, id) })
  }

  static async getUserByEmail(email: string) {
    return await db.query.user.findFirst({ where: eq(schema.user.email, email) })
  }

  static async updateUser(id: string, data: Partial<typeof schema.user.$inferSelect>) {
    return await db.update(schema.user).set(data).where(eq(schema.user.id, id))
  }
}
