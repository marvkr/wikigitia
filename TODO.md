# Wiki Generator - Implementation TODO

## Project Overview

Building an automatic **Wiki Generator** for GitHub repositories using our type-safe tech stack (Hono + Drizzle ORM + TanStack Query + Next.js).

**Goal**: One-click developer docs that engineering teams actually want to read.
**Time**: 48 hours total (~5 focused hours recommended)
**Tech Stack**: Next.js, Hono, Drizzle ORM, OpenAI, TailwindCSS, shadcn/ui

## Phase 1: Foundation Setup ✅

### 1.1 Project Structure & Dependencies

- [x] ~~Initialize Next.js project with TypeScript~~
- [x] ~~Setup Hono API routes with [...route] pattern~~
- [x] ~~Configure TailwindCSS v4 + shadcn/ui~~
- [x] ~~Setup PostCSS configuration~~
- [x] ~~Install additional dependencies~~

  **Why @octokit/rest?** Essential for GitHub integration:

  - Type-safe GitHub API responses
  - Built-in authentication handling
  - Rate limiting management
  - Repository structure fetching
  - File content access with line numbers

### 1.2 Database Schema Design ✅

- [x] ~~Setup Drizzle ORM configuration (`drizzle.config.ts`)~~
- [x] ~~Create database schema (`db/schema.ts`):~~
  - [x] ~~`repositories` table (id, url, owner, name, analyzed_at, etc.)~~
  - [x] ~~`subsystems` table (id, repo_id, name, description, type, files, etc.)~~
  - [x] ~~`wiki_pages` table (id, subsystem_id, title, content, citations, etc.)~~
  - [x] ~~`analysis_jobs` table (id, repo_id, status, progress, result, etc.)~~
- [x] ~~Generate Zod schemas with drizzle-zod~~
- [x] ~~Setup database connection and migrations~~

## Phase 2: Core API Routes (Repository Analysis) ✅

### 2.1 Repository Analysis API (`api/analyze.ts`) ✅

- [x] ~~**POST `/api/analyze`** - Start repository analysis~~
  - [x] ~~Validate GitHub URL with Zod~~
  - [x] ~~Use Octokit to fetch repository structure~~
  - [x] ~~Create analysis job in database~~
  - [x] ~~Return job ID for status tracking~~
- [x] ~~**GET `/api/analyze/:jobId`** - Get analysis status~~
  - [x] ~~Query job status from database~~
  - [x] ~~Return progress and results~~

### 2.2 GitHub Integration (`lib/github.ts`) ✅

- [x] ~~Setup Octokit client~~
- [x] ~~`fetchRepositoryStructure()` function (`getAllFiles`)~~
- [x] ~~`getFileContent()` function~~
- [x] ~~`parseRepositoryMetadata()` function~~
- [x] ~~File type detection and filtering logic~~
- [x] ~~GitHub URL generation for citations~~

### 2.3 AI Analysis Engine (`lib/analyzer.ts`) ✅

- [x] ~~Setup OpenAI client~~
- [x] ~~`analyzeRepository()` function using GPT-4~~
- [x] ~~`categorizeComponents()` function (feature/service/utility)~~
- [x] ~~`generateDescriptions()` function~~
- [x] ~~`extractEntryPoints()` function~~
- [x] ~~Error handling and retry logic~~
- [x] ~~Export analyzeRepository for tests~~

## Phase 3: Wiki Generation System ✅

### 3.1 Wiki API Routes (`api/wiki.ts`) ✅

- [x] ~~**POST `/api/wiki/generate`** - Generate wiki from analysis~~
  - [x] ~~Validate analysis data with Zod~~
  - [x] ~~Use OpenAI to create human-readable content~~
  - [x] ~~Generate inline citations with line numbers~~
  - [x] ~~Store wiki pages in database~~
- [x] ~~**GET `/api/wiki/:wikiId`** - Get complete wiki~~
- [x] ~~**GET `/api/wiki/:wikiId/page/:pageId`** - Get specific page~~

### 3.2 Content Generation (`lib/wiki-generator.ts`) ✅

- [x] ~~`generateWikiPage()` function using OpenAI~~
- [x] ~~`createInlineCitations()` function (integrated)~~
- [x] ~~`buildNavigationStructure()` function (table of contents)~~
- [x] ~~Markdown formatting and syntax highlighting~~
- [x] ~~Export generateWikiPage for tests~~
- [ ] Architecture diagram generation (bonus)

### 3.3 Citation System (Integrated) ✅

- [x] ~~Link citations to specific GitHub lines~~
- [x] ~~Generate GitHub permalink URLs~~
- [x] ~~Context extraction around cited code~~
- [x] ~~Citation validation and cleanup~~

## Phase 4: Frontend Implementation ✅

### 4.1 TanStack Query Hooks ✅

- [x] ~~`useAnalyzeRepository()` mutation hook~~
- [x] ~~`useGetAnalysisStatus()` query hook~~
- [x] ~~`useGenerateWiki()` mutation hook~~
- [x] ~~`useGetWiki()` query hook~~
- [x] ~~`useGetWikiPage()` query hook~~
- [x] ~~Error handling and loading states~~
- [x] ~~Toast notifications for user feedback~~

### 4.2 Core Pages & Components ✅

- [x] ~~**Home Page** (`app/page.tsx`)~~
  - [x] ~~Repository URL input form~~
  - [x] ~~Analysis status display~~
  - [x] ~~Beautiful landing page with features~~
- [ ] **Wiki Page** (`app/wiki/[wikiId]/page.tsx`)
  - [ ] Navigation sidebar
  - [ ] Main content area
  - [ ] Table of contents
- [ ] **Subsystem Page** (`app/wiki/[wikiId]/[pageId]/page.tsx`)
  - [ ] Detailed subsystem documentation
  - [ ] Interactive citations
  - [ ] Code snippets with syntax highlighting

### 4.3 UI Components (shadcn/ui) ✅

- [x] ~~`RepositoryInputForm` - URL input with validation~~
- [x] ~~`AnalysisProgress` - Progress indicator~~
- [x] ~~Form components (form.tsx)~~
- [x] ~~Toast notifications~~
- [ ] `WikiSidebar` - Navigation component
- [ ] `CitationLink` - Interactive citation links
- [ ] `CodeBlock` - Syntax highlighted code
- [ ] `SubsystemCard` - Subsystem overview cards

## Phase 5: Search & Navigation

### 5.1 Search API (`api/search.ts`)

- [ ] **GET `/api/search/:repoId`** - Search wiki content
- [ ] Keyword search implementation
- [ ] Search result ranking
- [ ] Search history (optional)

### 5.2 Navigation System

- [ ] Auto-generated table of contents
- [ ] Breadcrumb navigation
- [ ] Inter-page linking
- [ ] Mobile-responsive sidebar

## Phase 6: Bonus Features (Time Permitting)

### 6.1 Chat Interface (RAG)

- [ ] Setup vector embeddings for wiki content
- [ ] **POST `/api/chat/:repoId`** - Chat endpoint
- [ ] `ChatInterface` component
- [ ] Context-aware responses with citations

### 6.2 Live Updates

- [ ] GitHub webhook handler (`api/webhooks/github.ts`)
- [ ] Webhook signature verification
- [ ] Auto-regeneration on repository changes
- [ ] Real-time updates via WebSockets/SSE

### 6.3 Enhanced Analytics

- [ ] Repository complexity metrics
- [ ] Test coverage visualization
- [ ] Dependency graph generation
- [ ] Architecture diagram automation

## Phase 7: Polish & Deployment

### 7.1 Error Handling & Validation

- [ ] Comprehensive error boundaries
- [ ] User-friendly error messages
- [ ] Input validation on all forms
- [ ] API rate limiting and retries

### 7.2 Performance Optimization

- [ ] Database query optimization
- [ ] Caching strategy for API responses
- [ ] Image optimization for diagrams
- [ ] Code splitting and lazy loading

### 7.3 Deployment Setup

- [ ] Environment variable configuration
- [ ] Database deployment (Neon/PlanetScale)
- [ ] Vercel deployment configuration
- [ ] Domain setup and SSL

### 7.4 Final Testing

- [ ] Test with example repositories:
  - [ ] <https://github.com/Textualize/rich-cli>
  - [ ] <https://github.com/browser-use/browser-use>
  - [ ] <https://github.com/tastejs/todomvc>
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Performance audit

## Development Notes

### Key Decisions Made

1. **Database**: Using Drizzle ORM for type safety
2. **API**: Hono with RPC for end-to-end typing
3. **AI**: OpenAI GPT-4 for analysis and content generation
4. **Frontend**: Next.js 14 with TanStack Query
5. **Styling**: TailwindCSS v4 + shadcn/ui components

### Success Criteria

- [ ] **End-to-end working demo** - Publicly accessible URL
- [ ] **Technical correctness** - Proper error handling, clean architecture
- [ ] **Craft & readability** - Polished UI, clean code, good naming
- [ ] **Smart AI leverage** - Effective use of OpenAI with cost controls
- [ ] **Product thinking** - Actually useful for real engineers

## Current Status: 🚀 Phase 4 - Frontend Complete, Ready for Wiki Pages

**Major Phases Completed:**

- ✅ **Phase 1**: Foundation Setup (Project structure, dependencies, database schema)
- ✅ **Phase 2**: Core API Routes (Repository analysis, GitHub integration, AI analysis)
- ✅ **Phase 3**: Wiki Generation System (API routes, content generation, citations)
- ✅ **Phase 4**: Frontend Implementation (Hooks, homepage, forms, progress tracking)

**Test Results:**
- 📊 **34/51 tests passing (67% success rate)**
- ✅ Core functionality tests: 10/10 passing
- ✅ API endpoints working
- ✅ Frontend components rendered
- ❌ GitHub token requirements resolved (no auth needed for public repos)

**What's Working:**
1. Repository analysis with AI-powered subsystem identification
2. Wiki page generation with inline citations
3. Beautiful homepage with repository input form
4. Real-time analysis progress tracking
5. Type-safe API with Hono + TanStack Query
6. Comprehensive database schema with Drizzle ORM

**Next Steps:**

1. Build wiki display pages (`/wiki/[wikiId]` and `/wiki/[wikiId]/[pageId]`)
2. Add remaining UI components (WikiSidebar, CitationLink, CodeBlock)
3. Test full end-to-end workflow
4. Deploy publicly

**Environment Variables Needed:**

```env
OPENAI_API_KEY=your_openai_key
GITHUB_TOKEN=your_github_token (optional, for higher rate limits)
DATABASE_URL=your_database_url
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
