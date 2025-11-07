# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack application featuring:
- **Backend**: Elysia.js API with Better Auth and Drizzle ORM
- **Frontend**: React SPA with Better Auth client
- **Deployment**: AWS via SST v3 (ECS Fargate)

**Monorepo Structure:**
```
/                     # Root (shared config)
├── src/             # Backend API (see src/CLAUDE.md)
├── public/          # Frontend SPA (see public/CLAUDE.md)
├── sst.config.ts    # Infrastructure as Code
└── package.json     # Shared dependencies
```

**Tech Stack:**
- Runtime: Bun
- Backend Framework: Elysia.js (latest)
- Frontend: React 19 + Better Auth client
- Database: PostgreSQL with Drizzle ORM
- Validation: drizzle-typebox (auto-generate Elysia schemas from Drizzle)
- Auth: Better Auth (OAuth + OTP, no passwords)
- Deployment: SST v3 on AWS (ECS Fargate)
- Monitoring: OpenTelemetry → Axiom
- Email: React Email + AWS SES
- SMS: AWS SNS

---

## Essential Commands

```bash
# Development
bun sst dev              # Start dev server with hot reload on :3000
bun dev                  # Alternative dev command

# Testing
bun test                 # Run all tests
bun test --watch         # Run tests in watch mode

# Email templates
bun run email            # Preview email templates at :3000

# Code Quality (Biome)
bun run lint             # Lint code
bun run lint:fix         # Lint and auto-fix issues
bun run format           # Format code
bun run check            # Run both linting and formatting checks
bun run check:fix        # Run both linting and formatting with auto-fix

# Building
bun run build            # Compile to standalone executable (./server)

# Database
bunx drizzle-kit generate   # Generate migrations
bunx drizzle-kit migrate    # Run migrations
bunx drizzle-kit push       # Push schema changes (dev only)
bunx drizzle-kit studio     # Open Drizzle Studio

# Deployment (SST)
bunx sst deploy             # Deploy to AWS (current stage)
bunx sst deploy --stage production  # Deploy to production
bunx sst dev                # Run with live AWS resources
bunx sst remove             # Remove deployment
bunx sst console            # Open SST Console for stage management
```

---

## Path Aliases

Configured in `tsconfig.json`:

```typescript
// Backend paths
import { db } from '@server/db'
import { auth } from '@server/lib/auth'
import { User } from '@server/modules/v1/user/service'

// Frontend paths
import { api } from '@public/lib/api'
import { Button } from '@public/components/ui/button'
import { authClient } from '@public/lib/auth-client'
```

**Available aliases:**
- `@server` → `src/server.ts`
- `@server/*` → `src/*`
- `@public/*` → `public/*`

---

## Architecture Overview

### Backend (src/)

Elysia.js API with cluster-based entry point for multi-core utilization.

**Key features:**
- Better Auth mounted at root (auto-handles `/api/auth/*`)
- RESTful API at `/v1/*`
- OpenAPI documentation at `/swagger`
- Static file serving from `public/`
- **drizzle-typebox**: Auto-generate Elysia validation schemas from Drizzle tables

**Validation Pattern (Table Singleton):**
```typescript
// Drizzle schema automatically becomes Elysia validation
import { db } from '@server/db/models'

export namespace UserModel {
  const { user } = db.select
  export { user }  // Type-safe, auto-validated, OpenAPI documented
}
```

**See `src/CLAUDE.md` for detailed backend documentation, including drizzle-typebox usage.**

### Frontend (public/)

React 19 SPA served as static files via `@elysiajs/static`.

**Key features:**
- Better Auth React client for authentication
- shadcn/ui components with Tailwind CSS v4
- Type-safe API client via Elysia Eden Treaty
- React Query for data fetching

**See `public/CLAUDE.md` for detailed frontend documentation.**

---

## SST Deployment

### Infrastructure (sst.config.ts)

SST v3 provisions the following AWS resources:

**Core Infrastructure:**
- **VPC**: Custom VPC with public/private subnets + bastion host
- **RDS Postgres**: Managed PostgreSQL with RDS Proxy for connection pooling
- **S3 Bucket**: File storage (WysteriaBucket)
- **ECS Fargate**: Containerized application deployment
- **Application Load Balancer**: HTTP routing (port 80 → 3000)

**Secrets Management:**
Required secrets (set via `sst secret set <name> <value>`):
- `GoogleClientId` + `GoogleClientSecret`
- `AppleClientId` + `AppleClientSecret`
- `AxiomToken` + `AxiomDataset`

### Deployment Stages

SST supports multiple stages (environments):

```bash
# Development (default)
bunx sst deploy

# Production
bunx sst deploy --stage production

# Custom stage
bunx sst deploy --stage staging
```

**Stage behavior:**
- **production**: Removal policy = `retain` (keeps resources on removal)
- **All other stages**: Removal policy = `remove` (cleans up resources)

### Setting Secrets

Secrets are stage-specific:

```bash
# Set for default stage
bunx sst secret set GoogleClientId your-client-id

# Set for production
bunx sst secret set GoogleClientId your-prod-client-id --stage production

# List secrets for current stage
bunx sst secret list
```

### Accessing Resources in Code

Resources are accessed via SST's `Resource` import:

```typescript
import { Resource } from 'sst'

// Database connection
const dbUrl = `postgresql://${Resource.WysteriaPostgres.username}:${Resource.WysteriaPostgres.password}@${Resource.WysteriaPostgres.host}:${Resource.WysteriaPostgres.port}/${Resource.WysteriaPostgres.database}`

// Secrets
const googleClientId = Resource.GoogleClientId.value
const axiomToken = Resource.AxiomToken.value

// S3 Bucket
const bucketName = Resource.WysteriaBucket.name
```

### Local Development with Live Resources

```bash
# Connect to live AWS resources (default stage)
bunx sst dev

# Connect to specific stage
bunx sst dev --stage production

# Your app runs locally but uses:
# - Live RDS database
# - Live S3 bucket
# - Live secrets
```

**Warning**: Be careful when using `--stage production` locally!

### Production Deployment Checklist

Before deploying to production:

1. **Set all required secrets:**
   ```bash
   bunx sst secret set GoogleClientId <value> --stage production
   bunx sst secret set GoogleClientSecret <value> --stage production
   bunx sst secret set AppleClientId <value> --stage production
   bunx sst secret set AppleClientSecret <value> --stage production
   bunx sst secret set AxiomToken <value> --stage production
   bunx sst secret set AxiomDataset <value> --stage production
   ```

2. **Run database migrations:**
   ```bash
   # Connect to production DB first
   bunx sst dev --stage production

   # Then run migrations
   bunx drizzle-kit migrate
   ```

3. **Deploy:**
   ```bash
   bunx sst deploy --stage production
   ```

4. **Verify deployment:**
   - Check SST Console: `bunx sst console --stage production`
   - Check CloudWatch logs
   - Test API endpoints
   - Verify authentication flows

### Monitoring & Debugging

**SST Console:**
```bash
bunx sst console                # View default stage
bunx sst console --stage prod   # View production
```

**CloudWatch Logs:**
- ECS task logs available in AWS Console
- OpenTelemetry traces sent to Axiom

**Bastion Host (Database Access):**
```bash
# SSH to bastion for direct DB access
# (Requires AWS CLI configured)
aws ssm start-session --target <bastion-instance-id>
```

### Rollback Strategy

If deployment fails:

```bash
# Option 1: Remove and redeploy
bunx sst remove --stage production
bunx sst deploy --stage production

# Option 2: Deploy previous version
git checkout <previous-commit>
bunx sst deploy --stage production
```

**Note**: Production removal policy is `retain`, so database won't be deleted.

---

## Code Quality & Formatting

This project uses **Biome** for linting and formatting:

**Configuration:** `biome.json`
- Single quotes, 2-space indentation
- 100 character line width
- Semicolons as needed (automatic insertion)
- Import organization enabled
- Git-aware (respects .gitignore)

**Recommended workflow:**
```bash
bun run check:fix        # Fix all issues before committing
bun run lint:fix         # Fix only linting issues
bun run format           # Format code only
```

**Key settings:**
- `noExplicitAny`: off (TypeScript inference preferred)
- `noNonNullAssertion`: off (useful for Drizzle queries)
- `noUnusedVariables`: warn
- Trailing commas: ES5 style

---

## Environment & Resources

### Local Development

No `.env` file needed - SST handles all configuration via `Resource` imports.

### Environment Detection

```typescript
const isProduction = import.meta.env.NODE_ENV === 'production'
```

---

## Testing Patterns

Use Bun's built-in test runner:

```typescript
import { describe, it, expect } from 'bun:test'
import { app } from '@server/server'

describe('API Tests', () => {
  it('should respond with 200', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/health')
    )
    expect(response.status).toBe(200)
  })
})
```

---

## Important Notes

- **No password authentication**: Only OAuth and OTP
- **Phone auth creates temp emails**: Format `{phone}@temp.wysteria.io`
- **Better Auth handles all auth logic**: Don't implement custom auth
- **Session in cookies**: Better Auth uses httpOnly cookies
- **Drizzle manages migrations**: Don't manually edit schema tables
- **SST handles all AWS config**: Don't use AWS console directly
- **Static files served by Elysia**: Frontend built as static files in `public/`

---

## Additional Documentation

- **Backend API**: See `src/CLAUDE.md`
- **Frontend React App**: See `public/CLAUDE.md`
- **Elysia Framework**: See `/llms/elysia.txt` or https://elysiajs.com
