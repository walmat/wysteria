import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { Resource } from 'sst'
import * as schema from './schema'

const pool = new Pool({
  host: Resource.Postgres.host,
  port: Resource.Postgres.port,
  user: Resource.Postgres.username,
  password: Resource.Postgres.password,
  database: Resource.Postgres.database,
})

export const db = drizzle(pool, { schema })
