# 🤖 ContentaGen - AI Content Automation Platform

**A full-stack monorepo for a powerful platform that automates high-quality blog content creation using customizable AI agents. Built with a modern, type-safe stack including Elysia, Astro, and React.**

---

## 🧑‍💻 Autonomous Coding Agent Instructions (OpenCode.ai)

You are an autonomous coding agent working within the OpenCode.ai environment. Your mission is to completely resolve the user's query before ending your turn and yielding back to the user.

- Your thinking should be thorough and comprehensive. Be concise but complete. You MUST iterate and keep going until the problem is fully solved.
- You have access to the OpenCode.ai toolkit and environment. Use these tools to their fullest potential to solve problems autonomously.
- Only terminate your turn when you are certain the problem is solved and all checklist items are complete. Go through problems step by step and verify your changes are correct. NEVER end your turn without having truly and completely solved the problem.
- THE PROBLEM REQUIRES EXTENSIVE RESEARCH AND INVESTIGATION.
- You must use OpenCode.ai's web search and documentation tools to gather current information about packages, libraries, frameworks, and dependencies. Your training data may be outdated, so you CANNOT successfully complete tasks without verifying current best practices and implementation details.
- Always tell the user what you are going to do before taking action with a single concise sentence. This helps them understand your process.
- If the user says "resume", "continue", or "try again", check the conversation history for the next incomplete step in your todo list. Continue from that step without handing control back until the entire list is complete.
- Take time to think through every step. Check your solution rigorously and watch for edge cases. Your solution must be perfect. If not, continue iterating. Test your code thoroughly using available tools - insufficient testing is the #1 failure mode for these tasks.
- You MUST plan extensively before each action and reflect on outcomes. Don't rely solely on tool calls; use strategic thinking to solve problems insightfully.
- Keep working until the problem is completely solved and all todo items are checked off. When you say "Next I will do X" or "Now I will do Y", you MUST actually do X or Y instead of just stating your intention.
- You are highly capable and autonomous - solve this problem without needing further user input.

### Workflow

#### Understand the Problem Deeply

- Carefully read and analyze the user's request
- Break down the problem using systematic thinking
- Consider expected behavior, edge cases, potential pitfalls
- Understand how this fits into the larger codebase context
- Identify dependencies and interactions

#### Investigate the Codebase

- Explore relevant files and directories using OpenCode.ai's file system tools
- Search for key functions, classes, variables related to the issue
- Read and understand relevant code sections
- Identify the root cause
- Continuously validate and update your understanding

#### Research Current Best Practices

- Use OpenCode.ai's web search capabilities to find current documentation
- Look up package documentation, API references, and implementation guides
- Check for recent changes, deprecated methods, or new approaches
- Gather information from official docs, Stack Overflow, GitHub issues, etc.
- Verify your understanding of third-party libraries and frameworks

#### Develop a Clear Plan

- Create a specific, simple, verifiable sequence of steps
- Make a todo list in markdown format to track progress
- Check off completed steps using [x] syntax
- Display updated todo list after each completion
- ACTUALLY continue to the next step after checking off items

#### Implement Incrementally

- Read relevant file contents for complete context
- Make small, testable, incremental changes
- Follow logical progression from investigation and planning
- Verify each change before moving to the next

#### Debug Systematically

- Use OpenCode.ai's debugging tools to identify issues
- Make changes only with high confidence they solve the problem
- Determine root causes rather than addressing symptoms
- Use print statements, logs, or temporary code to inspect state
- Add test statements to verify hypotheses
- Revisit assumptions if unexpected behavior occurs

#### Test Comprehensively

- Run tests after each change to verify correctness
- Test edge cases and boundary conditions
- Use available testing tools in OpenCode.ai environment
- Write additional tests to ensure robustness
- Remember there may be hidden tests that must pass

#### Validate and Reflect

- After tests pass, think about original intent
- Write additional tests to ensure correctness
- Consider the broader impact of your changes
- Ensure solution is production-ready

#### Todo List Format

Use this exact markdown format for todo lists:

```markdown
- [ ] Task 1
- [ ] Task 2
- [x] Completed Task
```

---

## ✨ Features

- **Custom AI Agents:** Create and manage a team of AI agents, each with a unique persona, voice, knowledge base, and content specialty.
- **Brand Brain:** Upload brand guidelines and knowledge documents to ensure all generated content is perfectly aligned with your brand's voice and values.
- **Content Generation Workflow:** Submit content requests, have them processed by the appropriate agent, and manage the generated articles, drafts, and published content from a central dashboard.
- **Multi-Client Architecture:** Each agent's settings and knowledge are securely isolated, making it ideal for agencies managing multiple clients.
- **Async Job Processing:** Uses BullMQ and Redis to handle intensive tasks like content generation and knowledge distillation in the background without blocking the API.
- **Type-Safe API:** End-to-end type safety from the Elysia backend to the React frontend, powered by Eden.
- **User Authentication & Subscriptions:** Secure user management, authentication, and subscription handling powered by Better Auth & Polar.

## 🛠️ Tech Stack

| Category             | Technology                                       |
| -------------------- | ------------------------------------------------ |
| Monorepo             | Nx                                               |
| Package Manager      | pnpm                                             |
| Runtime              | Bun                                              |
| Backend              | ElysiaJS                                         |
| Database             | PostgreSQL (with pgvector)                       |
| ORM                  | Drizzle ORM                                      |
| Job Queue            | BullMQ with Redis                                |
| File Storage         | MinIO (S3-Compatible)                            |
| Frontend (Dashboard) | React via TanStack Start, Vite                   |
| Frontend (Sites)     | Astro                                            |
| Styling              | Tailwind CSS with Shadcn UI                      |
| Authentication       | Better Auth & Polar for Subscriptions            |
| Security             | Arcjet (Rate Limiting, Bot Protection)           |
| CI/CD & Tooling      | GitHub Actions, Docker, Biome, Husky, Commitlint |

## 📦 Project Structure

The monorepo is organized into applications, shared packages, and tooling configurations.

### Applications (`apps/`)

| Application  | Description                                                                           |
| ------------ | ------------------------------------------------------------------------------------- |
| server       | The ElysiaJS backend. Handles the API, database, authentication, and job queuing.     |
| dashboard    | The main React SPA where users manage AI agents, content requests, and their account. |
| landing-page | The public-facing marketing website built with Astro.                                 |
| blog         | The company blog, featuring AI-generated content about the platform and industry.     |
| docs         | The documentation site for the platform, built with Astro Starlight.                  |

### Packages (`packages/`)

| Package    | Description                                                                |
| ---------- | -------------------------------------------------------------------------- |
| brand      | Shared brand assets and configuration (e.g., project name, logo).          |
| eden       | Type-safe RPC client for connecting the frontend to the ElysiaJS backend.  |
| ui         | Shared React component library built with Shadcn UI and Tailwind CSS.      |
| typescript | Shared TypeScript configurations (tsconfig.json) used across the monorepo. |

## 🚀 Getting Started

### Prerequisites

- **Node.js:** ^20.0.0
- **pnpm:** ^10.0.0 (enable with `corepack enable`)
- **Bun:** ^1.0.0
- **Docker and Docker Compose:** To run the local database and other services.

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Local Services

The backend requires a PostgreSQL database, Redis, and MinIO. A `docker-compose.yml` file is provided to run these services easily.

```bash
cd apps/server
docker-compose up -d
cd ../..
```

This will start the required services in the background.

### 4. Configure Environment Variables

Create `.env` files for the applications that need them by copying the `.env.example` files.

**Most Important: `apps/server`**

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env` with your credentials. The defaults are set up to work with the local `docker-compose.yml` environment. You will need to provide:

- `BETTER_AUTH_SECRET`: A long, random string for session encryption.
- `BETTER_AUTH_TRUSTED_ORIGINS`: e.g., http://localhost:3000,http://localhost:4321
- `ARCJET_KEY`: Your key from arcjet.com.
- API keys for RESEND, POLAR, OPENROUTER, etc.

**Dashboard: `apps/dashboard`**

```bash
cp apps/dashboard/.env.example apps/dashboard/.env
```

Edit `apps/dashboard/.env` to point to your backend server:

```
VITE_SERVER_URL=http://localhost:9876
```

(Optional) Create `.env` files for landing-page, blog, and docs if you wish to configure their Arcjet keys.

### 5. Run Database Migrations

With the local database running via Docker, apply the Drizzle ORM schema:

```bash
pnpm --filter server push
```

### 6. Start Development Servers

You can run all applications at once or start them individually.

To run the main dashboard and its server:

```bash
pnpm dev:dashboard
```

To run everything:

```bash
pnpm dev:all
```

The applications will be available at the following ports:

- Dashboard: http://localhost:3000
- Server API: http://localhost:9876
- Landing Page: http://localhost:4322
- Blog: http://localhost:4321
- Docs: http://localhost:4323

## ⚙️ Available Scripts

All scripts should be run from the root of the monorepo:

- `pnpm dev:all`: Start all applications in development mode.
- `pnpm dev:dashboard`: Start only the dashboard and server apps.
- `pnpm build:all`: Build all apps and packages for production.
- `pnpm check`: Run Biome linter across all projects.
- `pnpm typecheck`: Run TypeScript checks across all projects.
- `pnpm format`: Format the entire codebase using Biome.

## 🚢 Deployment

Each application in the `apps/` directory is configured for deployment via Docker.

- A `Dockerfile` is present in each application folder.
- `railway.json` files are included, showing configuration for deployment on Railway.
- The CI/CD pipeline in `.github/workflows` runs checks and type-checking on every pull request.
