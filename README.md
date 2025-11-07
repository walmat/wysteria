# Wysteria

A full-stack application built with Elysia.js, Better Auth, and deployed to AWS via SST v3.

## Tech Stack

- **Runtime**: Bun
- **Backend**: Elysia.js with Better Auth
- **Frontend**: React 19 + Better Auth client
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Better Auth (OAuth + OTP, no passwords)
- **Deployment**: SST v3 on AWS (ECS Fargate)
- **Monitoring**: OpenTelemetry → Axiom
- **Email**: React Email + AWS SES
- **SMS**: AWS SNS

## Prerequisites

- [Bun](https://bun.sh) (latest version)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [GitHub CLI](https://cli.github.com/) (optional, for creating repos)

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Set Up Secrets

SST uses AWS SSM Parameter Store for secrets. Set the required secrets for your stage:

```bash
# Required secrets
bunx sst secret set GoogleClientId <your-google-client-id>
bunx sst secret set GoogleClientSecret <your-google-client-secret>
bunx sst secret set AppleClientId <your-apple-client-id>
bunx sst secret set AppleClientSecret <your-apple-client-secret>
bunx sst secret set AxiomToken <your-axiom-token>
bunx sst secret set AxiomDataset <your-axiom-dataset>
```

For production:
```bash
bunx sst secret set GoogleClientId <value> --stage production
# ... repeat for all secrets
```

### 3. Start Development Server

```bash
bun sst dev
```

This will:
- Deploy AWS infrastructure (VPC, RDS, S3, etc.) if needed
- Connect to live AWS resources
- Start the development server on `http://localhost:3000`
- Enable hot reload for both backend and frontend

## Development Commands

```bash
# Start dev server with live AWS resources
bun sst dev

# Run tests
bun test
bun test --watch

# Code quality (Biome)
bun run lint              # Lint code
bun run lint:fix          # Lint and auto-fix
bun run format            # Format code
bun run check             # Lint + format check
bun run check:fix         # Fix all issues

# Email template preview
bun run email             # Preview at :3000

# Build standalone executable
bun run build             # Creates ./server
```

## Database Management

```bash
# Generate new migration
bunx drizzle-kit generate

# Run migrations
bunx drizzle-kit migrate

# Push schema changes (dev only)
bunx drizzle-kit push

# Open Drizzle Studio
bunx drizzle-kit studio
```

## Deployment

### Deploy to Default Stage

```bash
bunx sst deploy
```

### Deploy to Production

```bash
# Set production secrets first
bunx sst secret set GoogleClientId <value> --stage production
# ... set all other secrets

# Deploy
bunx sst deploy --stage production
```

### Manage Deployments

```bash
# Open SST Console
bunx sst console

# Remove deployment
bunx sst remove

# Remove specific stage
bunx sst remove --stage production
```

## Project Structure

```
/
├── src/                 # Backend API (Elysia.js)
│   ├── lib/            # Auth, email, plugins
│   ├── modules/        # API modules (v1/user, etc.)
│   ├── db/             # Drizzle schema
│   └── emails/         # React Email templates
├── public/             # Frontend SPA (React)
│   ├── components/     # UI components (shadcn)
│   ├── layouts/        # App layouts
│   └── lib/            # API client, auth client
├── drizzle/            # Database migrations
├── sst.config.ts       # Infrastructure as Code
└── package.json        # Dependencies
```

## Path Aliases

```typescript
// Backend
import { db } from '@server/db'
import { auth } from '@server/lib/auth'

// Frontend
import { Button } from '@public/components/ui/button'
import { authClient } from '@public/lib/auth-client'
```

## Architecture

### Backend (src/)

- Elysia.js API with cluster-based entry point
- Better Auth mounted at root (`/api/auth/*`)
- RESTful API at `/v1/*`
- OpenAPI docs at `/swagger`
- Static file serving from `public/`

### Frontend (public/)

- React 19 SPA
- Better Auth React client
- shadcn/ui components with Tailwind CSS v4
- Type-safe API client via Elysia Eden Treaty
- React Query for data fetching

### AWS Infrastructure (SST)

- **VPC**: Custom VPC with public/private subnets + bastion host
- **RDS Postgres**: Managed PostgreSQL with RDS Proxy
- **S3**: File storage bucket
- **ECS Fargate**: Containerized app deployment
- **ALB**: Application Load Balancer (port 80 → 3000)

## Authentication

Better Auth handles all authentication:
- **OAuth**: Google, Apple
- **OTP**: Email and SMS verification
- **No passwords**: Passwordless authentication only
- **Phone auth**: Creates temporary emails (`{phone}@temp.wysteria.io`)

## Environment Variables

No `.env` file needed! SST provides all configuration via the `Resource` import:

```typescript
import { Resource } from 'sst'

// Database
const dbUrl = Resource.WysteriaPostgres.host

// Secrets
const googleClientId = Resource.GoogleClientId.value

// S3
const bucketName = Resource.WysteriaBucket.name
```

## Production Checklist

Before deploying to production:

1. Set all required secrets with `--stage production`
2. Run database migrations: `bunx drizzle-kit migrate`
3. Deploy: `bunx sst deploy --stage production`
4. Verify deployment in SST Console
5. Test authentication flows
6. Check CloudWatch logs

## Monitoring

- OpenTelemetry traces sent to Axiom
- CloudWatch logs for ECS tasks
- SST Console for infrastructure monitoring

## Documentation

- [Backend API](src/CLAUDE.md)
- [Frontend](public/CLAUDE.md)
- [Elysia Framework](https://elysiajs.com)
- [Better Auth](https://better-auth.com)
- [SST Docs](https://sst.dev)

## License

MIT
