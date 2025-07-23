# Wikigitia - Automatic Wiki Generator for GitHub Repositories

Transform any GitHub repository into comprehensive, AI-generated documentation with just one click. Perfect for developers who want to understand codebases quickly.

## 🚀 Live Demo

**[View Live Application →](https://wikigitia.vercel.app)**

## 📋 Project Overview

Wikigitia is an automatic **Wiki Generator** that analyzes public GitHub repositories and creates human-readable documentation. Built as part of the cubic coding challenge, it demonstrates intelligent repository analysis, AI-powered content generation, and modern full-stack development practices.

### Core Features

✅ **Repository Analyser** - Automatically identifies high-level subsystems (features, services, CLI tools, data layers, etc.)  
✅ **Wiki Generator** - Creates human-readable pages with descriptions, interfaces, and inline citations  
✅ **Smart Navigation** - Sidebar navigation with search history and table of contents  
✅ **Mobile Responsive** - Optimized for all device sizes with drawer/sheet navigation  
✅ **Real-time Progress** - Live updates during analysis and wiki generation  
✅ **Type-Safe Architecture** - End-to-end type safety from database to frontend

## 🛠️ Tech Stack

### Core Framework

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[shadcn/ui](https://ui.shadcn.com/)** - Modern component library

### Backend & Database

- **[Hono](https://hono.dev/)** - Fast, lightweight API framework with excellent TypeScript support
- **[Drizzle ORM](https://orm.drizzle.team/)** - Type-safe database ORM
- **[drizzle-zod](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-zod)** - Automatic Zod schema generation
- **[Neon PostgreSQL](https://neon.tech/)** - Serverless PostgreSQL database
- **[Inngest](https://www.inngest.com/)** - Background job processing and workflows

### AI & Data Processing

- **[OpenAI GPT-4](https://openai.com/)** - Repository analysis and content generation
- **[GitHub API](https://docs.github.com/en/rest)** - Repository data fetching
- **[Vercel AI SDK](https://sdk.vercel.ai/)** - AI integration utilities

### Frontend State Management

- **[TanStack Query](https://tanstack.com/query)** - Server state management with caching
- **[Hono RPC](https://hono.dev/guides/rpc)** - End-to-end type safety between API and frontend
- **[React Hook Form](https://react-hook-form.com/)** - Form handling with validation

### Development & Testing

- **[Vitest](https://vitest.dev/)** - Fast unit testing framework
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

## 🏗️ Architecture

### Type-Safe Full-Stack Flow

```
Database Schema (Drizzle) → Auto-Generated Zod Schemas → API Routes (Hono) → RPC Client → React Hooks (TanStack Query) → UI Components
```

### Key Architectural Decisions

1. **End-to-End Type Safety** - Database schema changes automatically propagate to frontend
2. **Background Processing** - Long-running analysis jobs handled by Inngest
3. **Mobile-First Design** - Responsive layouts with drawer/sheet navigation
4. **Real-time Updates** - Polling-based progress tracking during analysis
5. **Caching Strategy** - Intelligent data caching with TanStack Query

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (we recommend [Neon](https://neon.tech/))
- OpenAI API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/wikigitia.git
   cd wikigitia
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:

   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # OpenAI
   OPENAI_API_KEY="sk-..."

   # Inngest (for background jobs)
   INNGEST_EVENT_KEY="..."
   INNGEST_SIGNING_KEY="..."

   # App URL
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**

   ```bash
   pnpm drizzle-kit push
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Start Inngest dev server** (in a separate terminal)

   ```bash
   pnpm dev:inngest
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🧪 Testing

Our comprehensive test suite validates both core functionality and PROJECT.md requirements:

```bash
# Run all tests
pnpm test:run

# Core functionality tests (foundation)
pnpm test:core

# PROJECT.md requirements validation
pnpm test:requirements

# Watch mode for development
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Test Structure

- **Core Tests** (`tests/core.test.ts`) - Foundation functionality (10 tests)
- **Requirements Tests** (`tests/project-requirements.test.ts`) - Full PROJECT.md features (21 tests)

## 📁 Project Structure

```
wikigitia/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (Hono)
│   │   ├── wiki/              # Wiki pages
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── ...               # Custom components
│   ├── db/                   # Database schema & connection
│   ├── hooks/                # TanStack Query hooks
│   ├── lib/                  # Utilities & services
│   └── providers/            # React providers
├── tests/                    # Test files
├── drizzle/                 # Database migrations
└── public/                  # Static assets
```

## 🔄 How It Works

### 1. Repository Analysis

- User submits a GitHub repository URL
- System fetches repository structure via GitHub API
- OpenAI GPT-4 analyzes code to identify subsystems
- Results stored in PostgreSQL with type-safe schema

### 2. Wiki Generation

- Background job processes each identified subsystem
- AI generates comprehensive documentation with citations
- Content includes descriptions, interfaces, and code references
- Real-time progress updates via polling

### 3. Navigation & Display

- Responsive sidebar with subsystem navigation
- Mobile-friendly drawer interface
- Search history for previously analyzed repositories
- Direct links to source code with line-level citations

## 🎯 Key Features Implemented

### Repository Analyser

- ✅ Programmatic subsystem identification
- ✅ Machine-readable JSON structure
- ✅ Feature-driven and technical perspective balance
- ✅ Support for various subsystem types (feature, service, utility, CLI, API, data, core)

### Wiki Generator

- ✅ Human-readable pages for each subsystem
- ✅ Concise descriptions and public interfaces
- ✅ Inline citations linking to specific code lines
- ✅ Table of contents and navigation

### Deployment

- ✅ Publicly accessible at [wikigitia.vercel.app](https://wikigitia.vercel.app)
- ✅ Zero local setup required
- ✅ Mobile-responsive design

### Code Quality

- ✅ TypeScript throughout with strict type checking
- ✅ ESLint configuration with clean, idiomatic code
- ✅ Comprehensive test coverage
- ✅ Clear commit history documenting development process

## 🧩 Example Repositories

Try analyzing these repositories to see Wikigitia in action:

- **[Textualize/rich-cli](https://github.com/Textualize/rich-cli)** - Command-line tool with rich output
- **[browser-use/browser-use](https://github.com/browser-use/browser-use)** - Browser automation framework
- **[tastejs/todomvc](https://github.com/tastejs/todomvc)** - TodoMVC implementations

## 🚀 Deployment

### Vercel (Recommended)

1. **Deploy to Vercel**

   ```bash
   vercel --prod
   ```

2. **Set environment variables in Vercel dashboard**

   - Add all variables from `.env.local`
   - Ensure `NEXT_PUBLIC_APP_URL` points to your Vercel domain

3. **Configure database**
   - Ensure your PostgreSQL database is accessible from Vercel
   - Run migrations if needed

### Other Platforms

The application can be deployed to any platform supporting Next.js:

- **Netlify** - Configure build command: `pnpm build`
- **Railway** - Automatic deployments from Git
- **Fly.io** - Containerized deployment
- **Digital Ocean App Platform** - Managed deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test:run`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **cubic** for the coding challenge and opportunity
- **Vercel** for hosting and deployment platform
- **OpenAI** for GPT-4 API powering the analysis
- **shadcn** for the excellent UI component library
- **Drizzle Team** for the type-safe ORM solution

---

**Built with ❤️ for the cubic coding challenge**
