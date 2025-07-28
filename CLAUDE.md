# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Tech Stack Guide

This guide explains how we use **Hono**, **Drizzle ORM**, **drizzle-zod**, and **TanStack Query** to build type-safe, full-stack APIs in our Next.js application.

## Overview

Our stack provides end-to-end type safety from database schema to frontend components:

- **Drizzle ORM** - Type-safe database schema and queries
- **drizzle-zod** - Automatic Zod schema generation from Drizzle tables
- **Hono** - Fast, lightweight API framework with excellent TypeScript support
- **TanStack Query** - Powerful data fetching with caching and synchronization
- **Hono RPC** - End-to-end type safety between API routes and frontend

## Testing Strategy

### **Always Run Tests When Building Features**

**Before completing any feature, run our tests to validate PROJECT.md requirements:**

```bash
# 1. Quick validation of core functionality (foundation)
pnpm test:core

# 2. Full PROJECT.md requirements validation (what needs to be built)
pnpm test:requirements

# 3. Run all tests together
pnpm test:run
```

**Why This Matters:**

- ✅ **Validates PROJECT.md requirements** - Tests ensure we meet the core goals
- ✅ **Prevents regressions** - New code doesn't break existing functionality
- ✅ **Quality assurance** - Ensures code works before moving forward
- ✅ **Progress tracking** - See exactly what's implemented vs. what's needed

**Our Test Structure:**

- ✅ **Core Tests** (`tests/core.test.ts`) - Foundation functionality (10 tests)
- ❌ **Requirements Tests** (`tests/project-requirements.test.ts`) - Full PROJECT.md features (21 tests)

**When to Run Tests:**

- 🚨 **Before starting any feature** - Check current status with `pnpm test:requirements`
- 🚨 **After implementing functionality** - Validate with both `pnpm test:core` and `pnpm test:requirements`
- 🚨 **Before committing code** - Ensure `pnpm test:run` passes
- 🚨 **When debugging** - Use tests to verify fixes work

**Development Workflow:**

```bash
# 1. Check what needs to be built
pnpm test:requirements
# Shows: "analyzeRepository function not implemented yet"

# 2. Implement the feature
# Build the analyzeRepository function

# 3. Validate implementation
pnpm test:core          # Ensure foundation still works
pnpm test:requirements  # Check if new feature passes
pnpm test:run          # Full validation

# 4. Track progress
# 21 failing → 20 failing → 19 failing → etc.
```

**Success Criteria:**

- Core functionality validated (`pnpm test:core` passes)
- Requirements progress tracked (`pnpm test:requirements` shows fewer failures)
- All tests pass (`pnpm test:run` succeeds)
- PROJECT.md requirements met (all 21 requirements tests pass)

## Common Development Commands

### Development
```bash
# Start development server
pnpm dev

# Start Inngest dev server for background jobs (separate terminal)
pnpm dev:inngest

# Build for production
pnpm build

# Start production server
pnpm start
```

### Testing
```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test:watch

# Run specific test suites
pnpm test:core          # Core functionality tests
pnpm test:requirements  # PROJECT.md requirements validation

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### Database
```bash
# Push schema changes to database
pnpm drizzle-kit push

# Generate migrations
pnpm drizzle-kit generate

# View Drizzle Studio (database GUI)
pnpm drizzle-kit studio
```

### Code Quality
```bash
# Lint code
pnpm lint

# Run TypeScript type checking
pnpm tsc --noEmit
```

## Architecture Overview

### High-Level Architecture

Wikigitia is an automatic Wiki Generator built as a modern full-stack TypeScript application:

**Core Flow:**
1. **Repository Analysis** - User submits GitHub repo → AI analyzes structure → Identifies subsystems
2. **Background Processing** - Inngest handles long-running analysis jobs
3. **Wiki Generation** - AI creates comprehensive documentation with citations
4. **Type-Safe API** - Hono + Drizzle + TanStack Query for end-to-end type safety

### Key Technologies

- **Next.js 15** - React framework with App Router
- **Hono** - Fast, lightweight API framework with excellent TypeScript support
- **Drizzle ORM** - Type-safe database queries with PostgreSQL
- **Inngest** - Background job processing for repository analysis
- **TanStack Query** - Server state management with intelligent caching
- **OpenAI GPT-4** - Repository analysis and content generation
- **Vercel AI SDK** - AI integration utilities
- **shadcn/ui** - Component library built on Radix UI

### Database Schema

Located in `src/db/schema.ts`, our schema includes:

- **repositories** - GitHub repository metadata
- **analysisJobs** - Background job tracking with status
- **subsystems** - Identified code subsystems (features, services, utilities, etc.)
- **wikiPages** - Generated documentation with citations and table of contents

All schemas use drizzle-zod for automatic Zod validation schema generation.

### API Architecture

**Route Structure (`src/app/api/[[...route]]/`):**
- `route.ts` - Main router with rate limiting and route mounting
- `analyze.ts` - Repository analysis endpoints
- `wiki.ts` - Wiki generation and retrieval endpoints
- `repositories.ts` - Repository management endpoints

**Key Features:**
- Rate limiting (100 requests per 15 minutes per IP)
- End-to-end type safety with Hono RPC
- Automatic request/response validation with drizzle-zod

### Frontend Architecture

**Component Structure:**
- `src/components/ui/` - shadcn/ui components (accordion, button, dialog, etc.)
- `src/components/` - Custom application components
- `src/hooks/` - TanStack Query hooks for API interactions
- `src/providers/` - React context providers

**State Management:**
- TanStack Query for server state with intelligent caching
- React state for local UI state
- Type-safe hooks with Hono RPC client

### Background Jobs (Inngest)

Located in `src/lib/inngest-functions.ts`:

1. **analyzeRepository** - Multi-step repository analysis
   - Fetches GitHub repository structure
   - AI analysis to identify subsystems
   - Stores results in database
   - Triggers wiki generation

2. **generateWiki** - Wiki page generation
   - Processes each identified subsystem
   - Generates comprehensive documentation
   - Creates citations with line-level links
   - Handles re-analysis and updates

## Development Patterns

### 1. Database Schema Changes

When modifying `src/db/schema.ts`:

```bash
# Generate migration
pnpm drizzle-kit generate

# Push to database
pnpm drizzle-kit push
```

Zod schemas are auto-generated, so TypeScript types propagate automatically.

### 2. API Route Development

Follow the existing pattern in `src/app/api/[[...route]]/`:

```typescript
import { zValidator } from "@hono/zod-validator";
import { insertSchemaName } from "@/db/schema";

const app = new Hono()
  .post("/", zValidator("json", insertSchemaName), async (c) => {
    const values = c.req.valid("json"); // Fully typed!
    // Implementation...
  });
```

### 3. Frontend Hook Development

Create TanStack Query hooks in `src/hooks/`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetData = (id?: string) => {
  return useQuery({
    queryKey: ["data", id],
    queryFn: async () => {
      const response = await client.api.endpoint[":id"].$get({
        param: { id },
      });
      return await response.json();
    },
    enabled: !!id,
  });
};
```

### 4. Component Development

Use existing patterns with shadcn/ui components and proper TypeScript typing:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetData } from "@/hooks/use-get-data";

export function DataCard({ id }: { id: string }) {
  const { data, isLoading } = useGetData(id);
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data?.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data?.content}
      </CardContent>
    </Card>
  );
}
```

## Performance Considerations

### TanStack Query Caching Issues

**Problem:** Navigation between wiki pages causes unnecessary re-renders instead of using cached data.

**Common Causes:**
- Query keys not properly structured
- Missing `enabled` conditions
- Cache invalidation too aggressive
- Component remounting unnecessarily

**Solutions:**
1. Use consistent query keys: `["wiki", repositoryId, subsystemId]`
2. Implement proper `enabled` conditions in hooks
3. Use `staleTime` and `cacheTime` appropriately
4. Avoid unnecessary component re-mounting

**Example Fix:**
```typescript
export const useGetWikiPage = (repositoryId?: string, subsystemId?: string) => {
  return useQuery({
    queryKey: ["wiki-page", repositoryId, subsystemId],
    queryFn: async () => { /* ... */ },
    enabled: !!repositoryId && !!subsystemId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Wiki Content Depth

**Current Issue:** Wiki pages could provide more detailed analysis.

**Enhancement Areas:**
- Code complexity analysis
- Dependency relationship mapping
- Architecture pattern identification
- Performance considerations
- Security implications
- Testing coverage analysis

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Database
DATABASE_URL="postgresql://..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Inngest (background jobs)
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Hono)
│   │   └── [[...route]]/  # Catch-all API routes
│   ├── wiki/              # Wiki pages
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── *.tsx             # Custom components
├── db/                   # Database
│   ├── schema.ts         # Drizzle schema with auto-generated Zod
│   └── drizzle.ts        # Database connection
├── hooks/                # TanStack Query hooks
├── lib/                  # Utilities and services
│   ├── hono.ts          # RPC client
│   ├── github.ts        # GitHub API service
│   ├── analyzer.ts      # AI analysis service
│   ├── wiki-generator.ts # Wiki generation service
│   └── inngest-functions.ts # Background jobs
└── providers/            # React providers
```

## Key Files to Understand

1. **`src/db/schema.ts`** - Database schema and type definitions
2. **`src/app/api/[[...route]]/route.ts`** - API router setup
3. **`src/lib/hono.ts`** - RPC client configuration
4. **`src/lib/inngest-functions.ts`** - Background job definitions
5. **`src/hooks/use-get-wiki.ts`** - Main wiki data fetching logic

## Debugging Tips

1. **API Issues:** Check Hono route definitions and Zod validation schemas
2. **Database Issues:** Use `pnpm drizzle-kit studio` to inspect data
3. **Background Jobs:** Check Inngest dashboard and console logs
4. **Type Errors:** Ensure schema changes are pushed to database
5. **Caching Issues:** Clear TanStack Query cache or adjust query keys
6. **AI Analysis:** Check OpenAI API limits and response formatting

## Development Best Practices

1. **Always run tests** before committing code
2. **Use the existing patterns** for API routes, hooks, and components
3. **Follow TypeScript strictly** - leverage auto-generated types
4. **Test locally with Inngest** dev server for background jobs
5. **Use proper query keys** for TanStack Query caching
6. **Validate environment variables** are set correctly
7. **Follow the established commit message patterns** from git history

This architecture provides excellent developer experience with full type safety from database to frontend, intelligent caching, and robust background job processing.