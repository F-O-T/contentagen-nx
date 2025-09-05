## Live Demos

-   **Dashboard**: `https://app.contentagen.com` 
-   **Blog Example**: `https://blog.contentagen.com` - A live blog powered entirely by the sdk
-   
## 📂 Project Structure

This project is a monorepo managed by [Nx](https://nx.dev).

-   `apps/`: Contains the individual applications.
    -   `server`: ElysiaJS backend with tRPC for the API.
    -   `dashboard`: React (Vite) application for the user dashboard.
    -   `blog`: Astro-powered blog that consumes content from the SDK.
    -   `docs`: Astro-powered documentation site.
    -   `landing-page`: Astro-powered marketing landing page.
-   `packages/`: Shared libraries and utilities used across the monorepo.
    -   `api`: tRPC router definitions, shared between client and server.
    -   `authentication`: Shared authentication logic using Better Auth.
    -   `database`: Drizzle ORM schema, migrations, and repository logic.
    -   `workers`: BullMQ queue and worker definitions for background jobs.
    -   `ui`: Shared React component library using shadcn/ui and Tailwind CSS.
    -   `...and more!`
-   `tooling/`: Shared tooling configurations, like TypeScript `tsconfig.json` presets.

## 🛠️ Tech Stack

-   **Monorepo:** [Nx](https://nx.dev/) + [Bun](https://bun.sh/)
-   **Backend:** [ElysiaJS](https://elysiajs.com/), [tRPC](https://trpc.io/)
-   **Database:** [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
-   **Frontend (Dashboard):** [React](https://react.dev/), [Vite](https://vitejs.dev/), [TanStack Router](https://tanstack.com/router), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Frontend (Static Sites):** [Astro](https://astro.build/)
-   **AI Integration:** [OpenRouter](https://openrouter.ai/), [ChromaDB](https://www.trychroma.com/)
-   **Background Jobs:** [BullMQ](https://bullmq.io/) with [Redis](https://redis.io/)
-   **File Storage:** [MinIO](https://min.io/) (S3-compatible)
-   **Formatting & Linting:** [Biome](https://biomejs.dev/)

## 🤝 Contributing

We welcome contributions from the community! Whether it's a bug fix, a new feature, or improvements to documentation, your help is appreciated.

Please read our **[Contribution Guidelines](CONTRIBUTING.md)** to get started. It outlines our workflow, code style, and conventions.

## 📜 License

This project is licensed under the **Apache-2.0 License**. See the [LICENSE](LICENSE) file for details.
