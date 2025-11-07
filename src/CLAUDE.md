# Backend API Documentation

This file provides backend-specific guidance for the Wysteria Elysia.js API.

For shared project documentation, see `/CLAUDE.md` at the root.

---

## Architecture

### Cluster-Based Entry Point

The application uses Node.js clustering for multi-core utilization:

- **src/index.ts**: Entry point that spawns worker processes (one per CPU core)
- **src/server.ts**: Main Elysia server configuration (loaded by workers)

### Directory Structure

```
src/
├── index.ts              # Cluster entry point
├── server.ts             # Main Elysia app with middleware
├── auth-service.ts       # Auth macro for protected routes
├── db/
│   ├── index.ts         # Drizzle client initialization
│   ├── models.ts        # Pre-generated drizzle-typebox schemas
│   ├── typebox.ts       # Drizzle-typebox utility functions
│   └── schema/          # Database schemas
├── lib/
│   ├── auth.ts          # Better Auth configuration
│   ├── openapi.ts       # OpenAPI path merging for Better Auth
│   ├── email.ts         # Email sending utilities
│   ├── sns.ts           # SMS sending utilities
│   └── plugins/         # Custom Elysia plugins
├── modules/
│   └── v1/
│       ├── index.ts     # v1 API router
│       └── user/
│           ├── index.ts    # User controller (routes)
│           ├── model.ts    # User DTOs (validation schemas)
│           └── service.ts  # User business logic
└── emails/              # React Email templates
```

---

## MVC Pattern (Elysia-style)

This codebase follows Elysia's recommended MVC pattern:

### Controller (`index.ts`)

Elysia instance with route definitions:

```typescript
import { Elysia, status, t } from 'elysia'
import { authService } from '@server/auth-service'
import { UserModel } from './model'
import { User } from './service'

export const userController = new Elysia({ prefix: '/user' })
  .use(authService)

  .get('/me', ({ user }) => user, {
    auth: true,  // Apply auth macro
    detail: { summary: 'Get current user', tags: ['User'] },
    response: { 200: UserModel.user }
  })

  .get('/:id', async ({ params: { id } }) => {
    const user = await User.getById(id)
    if (!user) throw status(404, 'User not found')
    return user
  }, {
    params: t.Object({ id: t.String() }),
    response: { 200: UserModel.user },
    detail: { summary: 'Get user by ID', tags: ['User'] }
  })
```

### Model (`model.ts`)

Validation schemas using Elysia's `t` builder:

```typescript
import { t } from 'elysia'

export namespace UserModel {
  export const user = t.Object({
    id: t.String(),
    name: t.String(),
    email: t.String({ format: 'email' }),
    createdAt: t.Date()
  })
  export type User = typeof user.static

  export const update = t.Object({
    name: t.Optional(t.String()),
    email: t.Optional(t.String({ format: 'email' }))
  })
  export type Update = typeof update.static
}
```

**Type Safety:**
- Models define both runtime validation AND TypeScript types
- Use `typeof schema.static` to extract the TypeScript type
- No need for separate interfaces

---

## Drizzle-Typebox Integration

This project uses **drizzle-typebox** to automatically generate Elysia validation schemas from Drizzle database schemas, ensuring consistency between the database layer and API validation.

### Why Drizzle-Typebox?

- **Single Source of Truth**: Database schema definitions automatically become API validation schemas
- **Type Safety**: End-to-end type safety from database to API to frontend (via Eden Treaty)
- **DRY Principle**: No need to manually duplicate field definitions
- **Auto-Generated OpenAPI**: Validation schemas automatically appear in OpenAPI documentation

### Core Workflow

```
Drizzle Schema → drizzle-typebox → Elysia Validation → OpenAPI Docs → Eden Treaty
```

### Table Singleton Pattern (Recommended)

This project uses the **Table Singleton** pattern from Elysia's documentation. All database validation schemas are centralized in `src/db/models.ts` via the `db` object:

```typescript
// Import the db singleton
import { db } from '@server/db/models'

export namespace UserModel {
  // Destructure schemas from db.select or db.insert
  const { user } = db.select
  export { user }
  export type User = typeof user

  // For custom schemas, define them as usual
  export const updateProfile = t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    image: t.Optional(t.Union([t.String({ format: 'uri' }), t.Null()]))
  })
  export type UpdateProfile = typeof updateProfile.static
}
```

**Available schemas in `db` singleton:**
- `db.select.user` / `db.insert.user`
- `db.select.session` / `db.insert.session`
- `db.select.account` / `db.insert.account`
- `db.select.verification` / `db.insert.verification`

### Using Schemas in Routes

You can also destructure fields directly for inline validation:

```typescript
import { db } from '@server/db/models'

const { user } = db.insert

new Elysia().post('/sign-up', ({ body }) => {
  // body is validated with user.email and user.name
}, {
  body: t.Object({
    email: user.email,
    name: user.name
  })
})
```

### Critical Best Practice: Avoid Type Instantiation Errors

**ALWAYS declare a variable for drizzle-typebox schemas before using Elysia type utilities** (`t.Omit`, `t.Pick`, etc.):

```typescript
// ✅ CORRECT - Store in variable first
const _insertUser = createInsertSchema(table.user)
const insertUser = t.Omit(_insertUser, ['id', 'createdAt'])

// ❌ WRONG - Direct usage causes "Type instantiation is excessively deep" error
const insertUser = t.Omit(createInsertSchema(table.user), ['id'])
```

### Adding Schemas for New Tables

When you create a new Drizzle table, add it to the `db` singleton in `src/db/models.ts`:

```typescript
// src/db/models.ts
import { t } from 'elysia'
import { createInsertSchema, spreads } from './typebox'
import { table } from './schema'

export const db = {
  insert: spreads(
    {
      user: createInsertSchema(table.user, {
        email: t.String({ format: 'email' })
      }),
      // Add your new table here with custom validation
      post: createInsertSchema(table.post, {
        title: t.String({ minLength: 1, maxLength: 200 })
      })
    },
    'insert'
  ),
  select: spreads(
    {
      user: table.user,
      // Add your new table here
      post: table.post
    },
    'select'
  )
} as const
```

Then use it in your module models:

```typescript
import { db } from '@server/db/models'

export namespace PostModel {
  const { post } = db.select
  export { post }
  export type Post = typeof post
}
```

### Example: Complete Feature with Drizzle-Typebox

```typescript
// 1. Define Drizzle schema
// src/db/schema/posts.ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: uuid('user_id').notNull().references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

// 2. Export from schema index
// src/db/schema/index.ts
import * as authSchema from './auth-schema'
import * as postSchema from './posts'

export const table = {
  ...authSchema,
  ...postSchema
} as const

// 3. Add to db singleton in models.ts
// src/db/models.ts
export const db = {
  insert: spreads({
    user: createInsertSchema(table.user, {...}),
    post: createInsertSchema(table.post, {
      title: t.String({ minLength: 1, maxLength: 200 })
    })
  }, 'insert'),
  select: spreads({
    user: table.user,
    post: table.post
  }, 'select')
} as const

// 4. Use in module models
// src/modules/v1/posts/model.ts
import { db } from '@server/db/models'

export namespace PostModel {
  const { post } = db.select
  export { post }
  export type Post = typeof post

  // For create, pick only the fields needed
  const { title, content } = db.insert.post
  export const create = t.Object({ title, content })
  export type Create = typeof create.static
}

// 5. Use in controller
// src/modules/v1/posts/index.ts
.post('/', async ({ user, body }) => {
  return await Post.create(body, user.id)
}, {
  auth: true,
  body: PostModel.create,  // Auto-validated against Drizzle schema
  response: { 200: PostModel.post },
  detail: { summary: 'Create post', tags: ['Posts'] }
})
```

### Benefits in Practice

1. **No Schema Duplication**: Database fields automatically become validation rules
2. **Type Safety**: TypeScript knows exact database types in your API
3. **Automatic Updates**: Change a database field, API validation updates automatically
4. **Better OpenAPI**: Accurate request/response schemas in Swagger docs
5. **Eden Treaty**: Frontend gets fully typed API client

### Troubleshooting

**Error: "Type instantiation is excessively deep and possibly infinite"**
- You're using `t.Omit`/`t.Pick` directly on a drizzle-typebox schema
- Solution: Store the schema in a variable first (see "Critical Best Practice" above)

**Error: Schema not found**
- Make sure you've added the table to the `db` singleton in `src/db/models.ts`
- Check that the table is exported from `src/db/schema/index.ts` via the `table` object

### Service (`service.ts`)

Business logic as abstract class with static methods:

```typescript
import { db } from '@server/db'
import * as schema from '@server/db/schema'
import { eq } from 'drizzle-orm'

export abstract class User {
  static async getById(id: string) {
    return await db.query.user.findFirst({
      where: eq(schema.user.id, id)
    })
  }

  static async update(id: string, data: UserModel.Update) {
    const [updated] = await db
      .update(schema.user)
      .set(data)
      .where(eq(schema.user.id, id))
      .returning()
    return updated
  }

  static async delete(id: string) {
    await db.delete(schema.user).where(eq(schema.user.id, id))
  }
}
```

---

## Adding New Features

### 1. Create a New Module

```bash
src/modules/v1/posts/
├── index.ts      # Controller (routes)
├── model.ts      # DTOs (validation)
└── service.ts    # Business logic
```

### 2. Define Model (DTOs)

```typescript
// model.ts
import { t } from 'elysia'

export namespace PostModel {
  export const create = t.Object({
    title: t.String({ minLength: 1, maxLength: 200 }),
    content: t.String()
  })
  export type Create = typeof create.static

  export const post = t.Object({
    id: t.String(),
    title: t.String(),
    content: t.String(),
    userId: t.String(),
    createdAt: t.Date()
  })
  export type Post = typeof post.static
}
```

### 3. Implement Service

```typescript
// service.ts
import { db } from '@server/db'
import * as schema from '@server/db/schema'
import { eq } from 'drizzle-orm'
import type { PostModel } from './model'

export abstract class Post {
  static async create(data: PostModel.Create, userId: string) {
    const [post] = await db.insert(schema.posts).values({
      ...data,
      userId
    }).returning()
    return post
  }

  static async getById(id: string) {
    return await db.query.posts.findFirst({
      where: eq(schema.posts.id, id),
      with: { user: true }  // Include relations
    })
  }

  static async getUserPosts(userId: string) {
    return await db.query.posts.findMany({
      where: eq(schema.posts.userId, userId),
      orderBy: (posts, { desc }) => [desc(posts.createdAt)]
    })
  }
}
```

### 4. Create Controller

```typescript
// index.ts
import { Elysia, status, t } from 'elysia'
import { authService } from '@server/auth-service'
import { PostModel } from './model'
import { Post } from './service'

export const postController = new Elysia({ prefix: '/posts' })
  .use(authService)

  .post('/', async ({ user, body }) => {
    return await Post.create(body, user.id)
  }, {
    auth: true,
    body: PostModel.create,
    response: { 200: PostModel.post },
    detail: { summary: 'Create post', tags: ['Posts'] }
  })

  .get('/:id', async ({ params: { id } }) => {
    const post = await Post.getById(id)
    if (!post) throw status(404, 'Post not found')
    return post
  }, {
    params: t.Object({ id: t.String() }),
    response: { 200: PostModel.post },
    detail: { summary: 'Get post', tags: ['Posts'] }
  })

  .get('/user/:userId', async ({ params: { userId } }) => {
    return await Post.getUserPosts(userId)
  }, {
    params: t.Object({ userId: t.String() }),
    response: { 200: t.Array(PostModel.post) },
    detail: { summary: 'Get user posts', tags: ['Posts'] }
  })
```

### 5. Register in v1 Router

```typescript
// src/modules/v1/index.ts
import { Elysia } from 'elysia'
import { userController } from './user'
import { postController } from './posts'  // Import new controller

export const v1 = new Elysia({ prefix: '/v1', name: 'api.v1' })
  .use(userController)
  .use(postController)  // Add here
```

---

## Authentication Architecture

### Better Auth Configuration

**Better Auth** handles all authentication logic:
- Configured in `src/lib/auth.ts`
- Mounted at root level via `.mount(auth.handler)` in `src/server.ts:18`
- All auth routes automatically available at `/api/auth/*`
- OpenAPI spec merged into main documentation

**Supported Auth Methods:**
1. Google OAuth
2. Apple OAuth
3. Email OTP (6-digit codes, 5min expiry)
4. Phone OTP (6-digit codes, 5min expiry, creates temp email accounts)

### Auth Macro (authService)

The auth macro is defined in `src/auth-service.ts` and provides automatic session validation:

```typescript
// Using the auth macro
export const protectedController = new Elysia({ prefix: '/protected' })
  .use(authService)

  .get('/data', ({ user, session }) => {
    // user and session are automatically validated and typed
    return { userId: user.id, userName: user.name }
  }, {
    auth: true  // Apply auth macro - returns 401 if not authenticated
  })
```

**What the macro does:**
- Validates the session cookie
- Provides `user` and `session` in the route context
- Throws 401 if session is invalid or missing
- Type-safe user object

### Public vs Protected Routes

```typescript
// Public route (no auth required)
.get('/public', () => ({ message: 'Hello world' }))

// Protected route (auth required)
.get('/protected', ({ user }) => ({ message: `Hello ${user.name}` }), {
  auth: true
})

// Optional auth (user may or may not be logged in)
.get('/optional', ({ user }) => {
  if (user) return { message: `Hello ${user.name}` }
  return { message: 'Hello guest' }
})
// Note: Don't set auth: true for optional auth
```

---

## Database Integration

### Drizzle ORM with PostgreSQL

**Configuration:**
- Schema defined in `src/db/schema/`
- Better Auth tables auto-managed via `drizzleAdapter`
- Export all schemas from `src/db/schema/index.ts`
- Client initialized in `src/db/index.ts` with SST Resource bindings

### Database Access Patterns

```typescript
import { db } from '@server/db'
import * as schema from '@server/db/schema'
import { eq, and, or, desc } from 'drizzle-orm'

// Simple query
const user = await db.query.user.findFirst({
  where: eq(schema.user.id, id)
})

// Query with relations
const userWithPosts = await db.query.user.findFirst({
  where: eq(schema.user.id, id),
  with: { posts: true }
})

// Insert
const [newUser] = await db.insert(schema.user).values({
  name: 'John',
  email: 'john@example.com'
}).returning()

// Update
await db.update(schema.user)
  .set({ name: 'Jane' })
  .where(eq(schema.user.id, id))

// Delete
await db.delete(schema.user).where(eq(schema.user.id, id))

// Complex query
const posts = await db.query.posts.findMany({
  where: and(
    eq(schema.posts.userId, userId),
    eq(schema.posts.published, true)
  ),
  orderBy: [desc(schema.posts.createdAt)],
  limit: 10
})

// Transaction
await db.transaction(async (tx) => {
  await tx.insert(schema.user).values({ ... })
  await tx.insert(schema.posts).values({ ... })
})
```

### Schema Definition

```typescript
// src/db/schema/posts.ts
import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { user } from './auth'  // Better Auth user table
import { relations } from 'drizzle-orm'

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  userId: uuid('user_id').notNull().references(() => user.id),
  published: boolean('published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(user, {
    fields: [posts.userId],
    references: [user.id]
  })
}))
```

---

## Middleware & Plugins

Configured in `src/server.ts`:

1. **Better Auth** (`auth.handler`) - Handles all authentication
2. **Static Files** (`@elysiajs/static`) - Serves `public/` directory
3. **Rate Limiting** (`elysia-rate-limit`) - Default limits applied
4. **Server Timing** (`@elysiajs/server-timing`) - Performance metrics in response headers
5. **OpenTelemetry** (`@elysiajs/opentelemetry`) - Traces sent to Axiom
6. **CORS** (`@elysiajs/cors`) - Configured for production domains or open in dev
7. **OpenAPI** (`@elysiajs/openapi`) - Auto-generated docs at `/openapi` and `/swagger`

### Middleware Order

The order matters! Middleware is applied top-to-bottom:

```typescript
export const app = new Elysia()
  .mount(auth.handler)        // 1. Auth (must be first)
  .use(staticPlugin)          // 2. Static files
  .use(rateLimit())           // 3. Rate limiting
  .use(serverTiming())        // 4. Performance tracking
  .use(opentelemetry(...))    // 5. Observability
  .use(cors(...))             // 6. CORS
  .use(openapi(...))          // 7. OpenAPI docs
  .use(v1)                    // 8. API routes
```

---

## OpenAPI Documentation

### Best Practices

Always add `detail` to routes for better documentation:

```typescript
.get('/users', () => getUsers(), {
  detail: {
    summary: 'List all users',
    description: 'Returns a paginated list of all users',
    tags: ['User']
  },
  response: { 200: t.Array(UserModel.user) }
})
```

### Accessing Documentation

- OpenAPI JSON: `http://localhost:3000/openapi`
- Swagger UI: `http://localhost:3000/swagger`

### Type-Safe Client Generation

The OpenAPI spec is merged with Better Auth's spec via `src/lib/openapi.ts:55` for complete documentation.

---

## Common Patterns

### Error Handling

```typescript
import { status } from 'elysia'

// 404 Not Found
if (!resource) {
  throw status(404, 'Resource not found')
}

// 400 Bad Request
if (invalidData) {
  throw status(400, 'Invalid data provided')
}

// 403 Forbidden
if (user.id !== resource.ownerId) {
  throw status(403, 'You do not have permission to access this resource')
}

// Custom error with data
throw status(422, {
  message: 'Validation failed',
  errors: { email: 'Email already exists' }
})
```

### Validation

Elysia automatically validates request bodies, params, and query strings:

```typescript
.post('/users', async ({ body }) => {
  // body is automatically validated against UserModel.create
  return await User.create(body)
}, {
  body: UserModel.create,  // Validate body
  response: { 200: UserModel.user }  // Validate response
})

.get('/users/:id', async ({ params }) => {
  // params.id is automatically validated as string
  return await User.getById(params.id)
}, {
  params: t.Object({ id: t.String() })
})

.get('/users', async ({ query }) => {
  // query.limit is validated as optional number
  return await User.list(query.limit)
}, {
  query: t.Object({
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 }))
  })
})
```

### Database Transactions

```typescript
import { db } from '@server/db'
import * as schema from '@server/db/schema'

// Transaction example
export abstract class Order {
  static async create(userId: string, items: Item[]) {
    return await db.transaction(async (tx) => {
      // Create order
      const [order] = await tx.insert(schema.orders).values({
        userId,
        total: calculateTotal(items)
      }).returning()

      // Create order items
      await tx.insert(schema.orderItems).values(
        items.map(item => ({ orderId: order.id, ...item }))
      )

      // Update inventory
      for (const item of items) {
        await tx.update(schema.inventory)
          .set({ quantity: sql`quantity - ${item.quantity}` })
          .where(eq(schema.inventory.id, item.productId))
      }

      return order
    })
  }
}
```

---

## Email Templates

Located in `src/emails/`, built with React Email:

### Creating an Email Template

```typescript
// src/emails/welcome.tsx
import { Button, Html, Head, Body, Container, Text } from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  loginUrl: string
}

export default function WelcomeEmail({ name, loginUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Welcome {name}!</Text>
          <Button href={loginUrl}>Get Started</Button>
        </Container>
      </Body>
    </Html>
  )
}
```

### Sending Emails

```typescript
// In your service
import { sendEmail } from '@server/lib/email'
import WelcomeEmail from '@server/emails/welcome'

await sendEmail({
  to: user.email,
  subject: 'Welcome to Wysteria!',
  react: WelcomeEmail({ name: user.name, loginUrl: 'https://wysteria.io/login' })
})
```

### Preview Emails

```bash
bun run email
# Opens preview at http://localhost:3000
```

---

## Testing

### Writing Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '@server/server'

describe('User API', () => {
  let authToken: string

  beforeAll(async () => {
    // Setup: Create test user and get auth token
    authToken = await getTestAuthToken()
  })

  it('should return current user', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/user/me', {
        headers: { Cookie: `auth_session=${authToken}` }
      })
    )
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.email).toBeDefined()
  })

  it('should return 401 without auth', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/user/me')
    )
    expect(response.status).toBe(401)
  })

  afterAll(async () => {
    // Cleanup: Delete test user
    await deleteTestUser()
  })
})
```

### Running Tests

```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test user.test.ts # Run specific test
```

---

## Performance Considerations

1. **Clustering**: Automatically uses all CPU cores via `src/index.ts`
2. **Connection Pooling**: PostgreSQL pool configured in `src/db/index.ts`
3. **OpenTelemetry**: Batch processing for minimal overhead
4. **RDS Proxy**: Connection pooling and failover via SST
5. **Rate Limiting**: Prevents abuse with default limits

---

## Important Notes

- **Better Auth handles all auth logic**: Don't implement custom auth
- **Drizzle manages migrations**: Don't manually edit schema tables
- **Always use transactions** for multi-step operations
- **Validate all inputs** using Elysia's `t` builder
- **Add OpenAPI details** to all routes for documentation
- **Use the auth macro** instead of manual session checks
- **Services should be abstract classes** with static methods
- **Types are derived from schemas** - no separate interfaces needed

---

## Additional Resources

- **Elysia Documentation**: https://elysiajs.com
- **Elysia Framework Reference**: `/llms/elysia.txt`
- **Better Auth Documentation**: https://better-auth.com
- **Drizzle ORM Documentation**: https://orm.drizzle.team
- **Root Documentation**: `/CLAUDE.md`
- **Frontend Documentation**: `/public/CLAUDE.md`
