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

### **Using Tests as PROJECT.md Validation Checklist**

**Our requirements tests serve as a complete specification for PROJECT.md:**

```typescript
// tests/project-requirements.test.ts defines exactly what to build:

// ✅ Repository Analyser (7 tests)
expect(analysis).toMatchObject({
  repository: { owner: "Textualize", name: "rich-cli" },
  subsystems: expect.arrayContaining([
    expect.objectContaining({
      name: expect.any(String),
      type: expect.stringMatching(
        /^(feature|service|utility|cli|api|data|auth|core)$/
      ),
      files: expect.arrayContaining([expect.any(String)]),
    }),
  ]),
});

// ✅ Wiki Generator (3 tests)
expect(wikiPage).toMatchObject({
  title: expect.stringContaining("CLI Interface"),
  content: expect.stringMatching(/.{200,}/),
  citations: expect.arrayContaining([
    expect.objectContaining({
      url: expect.stringMatching(/https:\/\/github\.com/),
    }),
  ]),
});

// ✅ API Endpoints (4 tests)
// POST /api/analyze, GET /api/analyze/:jobId, POST /api/wiki/generate

// ✅ Frontend Integration (4 tests)
// useAnalyzeRepository hook, useGetAnalysisStatus hook, React components

// ✅ Deployment (2 tests)
// Public accessibility, CORS configuration

// ✅ End-to-End (1 test)
// Complete analysis-to-wiki workflow
```

**Progress Tracking:**

```bash
# Current Status Example:
✅ Foundation Tests: 10/10 passing (GitHub service basics)
❌ Requirements Tests: 3/21 passing (Repository analysis partially done)
📊 Total Progress: 13/31 tests passing (42%)
```

**When building features, ensure:**

1. **Requirements tests guide implementation** - Use failing tests as specifications
2. **Core tests still pass** - No regressions in foundation
3. **Progress is measurable** - Fewer failing tests = more complete PROJECT.md
4. **Quality maintained** - Clean, working code

**If tests fail:**

- 🚨 **Fix the issue** before proceeding
- 🚨 **Don't commit broken code**
- 🚨 **Use test output to understand what's missing**
- 🚨 **Ensure PROJECT.md requirements are being met**

## 1. Database Schema Setup (Drizzle ORM)

### Define Your Schema (`src/db/schema.ts`)

```typescript
import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Define the table
export const companies = pgTable("company", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email").notNull(),
  websiteUrl: text("website_url"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Define relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  products: many(products),
}));
```

### Generate Zod Schemas with drizzle-zod

```typescript
// Auto-generate Zod schemas from Drizzle tables
export const insertCompanySchema = createInsertSchema(companies);
export const selectCompanySchema = createSelectSchema(companies);

// Export TypeScript types
export type InsertCompanyType = z.infer<typeof insertCompanySchema>;
export type SelectCompanyType = z.infer<typeof selectCompanySchema>;

// Create custom schemas for specific use cases
export const supplierSchema = insertCompanySchema
  .extend({
    // Add custom validations
    isSeller: z.literal(true),
  })
  .omit({
    // Remove fields not needed for creation
    id: true,
    createdAt: true,
    updatedAt: true,
  });
```

## 2. API Route Setup (Hono)

### Create API Route (`src/app/api/[[...route]]/companies.ts`)

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { db } from "@/db/drizzle";
import { companies, insertCompanySchema } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as z from "zod";

const app = new Hono()
  // GET all companies
  .get("/", clerkMiddleware(), async (c) => {
    const data = await db.select().from(companies);

    if (!data) {
      return c.json({ error: "Failed to fetch companies" }, 500);
    }

    return c.json({ data }, 200);
  })

  // GET company by ID with validation
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().min(1, "ID is required"),
      })
    ),
    clerkMiddleware(),
    async (c) => {
      const { id } = c.req.valid("param");
      const auth = getAuth(c);

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, id))
        .limit(1);

      if (!data) {
        return c.json({ error: "Company not found" }, 404);
      }

      return c.json({ data }, 200);
    }
  )

  // POST create company with drizzle-zod validation
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertCompanySchema), // Auto-generated validation
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json"); // Fully typed!

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const [data] = await db.insert(companies).values(values).returning();

        return c.json({ data }, 200);
      } catch (error) {
        return c.json({ error: "Failed to create company" }, 500);
      }
    }
  )

  // PATCH update company with partial validation
  .patch(
    "/",
    clerkMiddleware(),
    zValidator("json", insertCompanySchema.partial()), // Partial updates
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      // Implementation...
    }
  );

export default app;
```

### Register Routes (`src/app/api/[[...route]]/route.ts`)

```typescript
import { Hono } from "hono";
import { handle } from "hono/vercel";
import companies from "./companies";
import users from "./users";
// ... other routes

const app = new Hono().basePath("/api");

// Register all routes
const routes = app.route("/companies", companies).route("/users", users);
// ... other routes

// Export handlers for Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);

// Export type for RPC client
export type AppType = typeof routes;
```

## 3. Hono RPC Client Setup

### Create RPC Client (`src/lib/hono.ts`)

```typescript
import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

// Create typed RPC client
export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);
```

## 4. TanStack Query Hooks

### Create Query Hooks (`src/hooks/use-get-companies.tsx`)

```typescript
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetCompanies = () => {
  const query = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      // Fully typed RPC call!
      const response = await client.api.companies.$get();

      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const { data } = await response.json(); // TypeScript knows the shape!
      return data;
    },
  });

  return query;
};
```

### Create Mutation Hooks (`src/hooks/use-create-company.tsx`)

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { InsertCompanyType } from "@/db/schema";

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (json: InsertCompanyType) => {
      // Fully typed request body!
      const response = await client.api.companies.$post({ json });

      if (!response.ok) {
        throw new Error("Failed to create company");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch companies
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });

  return mutation;
};
```

### Advanced Query Hooks with Parameters

```typescript
export const useGetCompany = (id?: string) => {
  const query = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");

      const response = await client.api.companies[":id"].$get({
        param: { id }, // Typed parameters!
      });

      if (!response.ok) {
        throw new Error("Failed to fetch company");
      }

      const { data } = await response.json();
      return data;
    },
    enabled: !!id, // Only run if ID exists
  });

  return query;
};
```

## 5. Frontend Usage

### Using Hooks in Components

```typescript
import { useGetCompanies, useCreateCompany } from "@/hooks/use-get-companies";
import { InsertCompanyType } from "@/db/schema";

export function CompanyList() {
  // Fetch data
  const { data: companies, isLoading, error } = useGetCompanies();

  // Create mutation
  const { mutate: createCompany, isPending } = useCreateCompany();

  const handleCreate = (companyData: InsertCompanyType) => {
    createCompany(companyData, {
      onSuccess: (data) => {
        console.log("Company created:", data);
      },
      onError: (error) => {
        console.error("Failed to create company:", error);
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {companies?.map((company) => (
        <div key={company.id}>
          {company.name} {/* Fully typed! */}
        </div>
      ))}
    </div>
  );
}
```

## Key Benefits

### 🔒 **End-to-End Type Safety**

- Database schema changes automatically propagate to API and frontend
- Compile-time errors prevent runtime bugs
- IntelliSense support throughout the stack

### 📝 **Automatic Validation**

- Zod schemas auto-generated from database tables
- Request/response validation at API level
- Client-side form validation using the same schemas

### 🚀 **Excellent Developer Experience**

- Hot module replacement works seamlessly
- Type errors caught at build time
- Auto-completion for API calls and data structures

### ⚡ **Performance**

- Hono is extremely fast and lightweight
- TanStack Query provides intelligent caching
- Edge runtime support with Vercel

### 🔧 **Maintainable Code**

- Single source of truth for data structures
- Consistent patterns across the application
- Easy refactoring with TypeScript support

## Common Patterns

### Custom Validation

```typescript
// In schema.ts
export const createCompanySchema = insertCompanySchema
  .extend({
    confirmEmail: z.string().email(),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Emails must match",
    path: ["confirmEmail"],
  });
```

### Error Handling

```typescript
// In API route
.post("/", zValidator("json", insertCompanySchema), async (c) => {
  try {
    // ... logic
  } catch (error) {
    if (error.code === "23505") { // Unique constraint violation
      return c.json({ error: "Company already exists" }, 409);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
})
```

### Query Invalidation

```typescript
// In mutation hook
onSuccess: () => {
  // Invalidate specific queries
  queryClient.invalidateQueries({ queryKey: ["companies"] });
  queryClient.invalidateQueries({ queryKey: ["company", data.id] });

  // Or invalidate all company-related queries
  queryClient.invalidateQueries({
    queryKey: ["companies"],
    exact: false
  });
},
```

This architecture provides a robust, type-safe foundation that scales well as your application grows!
