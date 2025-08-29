# ContentaGen

AI-powered content generation platform that helps creators and businesses produce high-quality content at scale. Built with modern web technologies and designed for performance, scalability, and ease of use.

## ✨ Features

- **AI Content Generation**: Leverage advanced AI models to create engaging content
- **Multi-Platform Publishing**: Generate content for blogs, social media, and more
- **Real-time Collaboration**: Work with your team in real-time
- **Content Analytics**: Track performance and engagement metrics
- **Custom Workflows**: Build automated content pipelines
- **API-First Design**: Full REST API for integrations
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind
- **Type-Safe**: Full TypeScript support throughout the stack
- **Scalable Architecture**: Built to handle high-volume content generation

## 🏗️ Architecture

ContentaGen is a monorepo built with modern web technologies:

```
apps/
├── blog/           # Astro-powered blog platform
├── dashboard/      # React admin dashboard
├── docs/           # Starlight documentation site
├── landing-page/   # Marketing website
└── server/         # Elysia.js API server

packages/
├── api/            # tRPC API layer
├── authentication/ # Auth system with Better Auth
├── database/       # Drizzle ORM with PostgreSQL
├── ui/             # Shared UI components
├── workers/        # Background job processing
├── files/          # File upload & management
├── payment/        # Payment integration
└── ...             # Additional shared packages
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for caching)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/contentagen.git
   cd contentagen
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/server/.env.example apps/server/.env.local
   cp packages/database/.env.example packages/database/.env.local
   ```

   Edit the `.env.local` files with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/contentagen"

   # Authentication
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"

   # AI Services
   OPENROUTER_API_KEY="your-openrouter-key"
   TAVILY_API_KEY="your-tavily-key"

   # File Storage
   MINIO_ENDPOINT="localhost:9000"
   MINIO_ACCESS_KEY="your-access-key"
   MINIO_SECRET_KEY="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npm run db:push:local
   ```

5. **Start the development environment**
   ```bash
   npm run dev:all
   ```

   This will start all applications:
   - Dashboard: http://localhost:3000
   - Blog: http://localhost:4321
   - Docs: http://localhost:4323
   - Landing Page: http://localhost:4322
   - API Server: http://localhost:4000

## 📖 Usage

### Creating Content

1. **Access the Dashboard**
   Navigate to http://localhost:3000 and sign in


3. **Generate with AI**
   The platform automatically generates content based on your prompts and requirements.

### API Integration

```typescript
import { createSdk } from "@contentagen/sdk";

const sdk = createSdk({
  apiKey: process.env.CONTENTAGEN_API_KEY!
});

// List all content
const content = await sdk.listContentByAgent({
  agentId: ["your-agent-id"],
  status: ["approved"],
  limit: 10
});

// Get specific content
const post = await sdk.getContentBySlug({
  slug: "my-article-slug",
  agentId: "your-agent-id"
});
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev:all              # Start all applications
npm run dev:dashboard        # Start only dashboard
npm run dev:server          # Start only API server
npm run dev:blog            # Start only blog

# Building
npm run build:all           # Build all applications
npm run build               # Build specific app

# Testing
npm run test                # Run all tests
npm run typecheck           # Type checking
npm run check               # Linting and formatting

# Database
npm run db:studio:local     # Open Drizzle Studio
npm run db:push:local       # Push schema changes
npm run db:migrate:local    # Run migrations
```

### Project Structure

```
├── apps/
│   ├── blog/               # Public blog (Astro)
│   ├── dashboard/          # Admin interface (React + Vite)
│   ├── docs/               # Documentation (Astro + Starlight)
│   ├── landing-page/       # Marketing site (Astro)
│   └── server/             # API server (Elysia.js)
├── packages/
│   ├── api/                # tRPC API definitions
│   ├── authentication/     # Auth system
│   ├── database/           # Database schema & migrations
│   ├── ui/                 # Shared UI components
│   ├── workers/            # Background jobs
│   └── ...                 # Other shared packages
├── tooling/
│   └── typescript/         # Shared TypeScript configs
└── nx.json                 # Nx workspace configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `BETTER_AUTH_SECRET` | Authentication secret | Yes |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | Yes |
| `TAVILY_API_KEY` | Tavily API key for web search | No |
| `REDIS_URL` | Redis connection string | No |
| `MINIO_*` | MinIO/S3 configuration | No |

### Database Schema

The application uses PostgreSQL with Drizzle ORM. Schema files are located in `packages/database/src/schemas/`.

## 🚀 Deployment

### Docker Deployment

```bash
# Build all applications
npm run build:all

# Create production Docker images
docker build -f apps/server/Dockerfile -t contentagen-server .
docker build -f apps/dashboard/Dockerfile -t contentagen-dashboard .
# ... build other services

# Run with Docker Compose
docker-compose up -d
```

### Railway Deployment

The project includes Railway configuration files for easy deployment:

```bash
# Deploy to Railway
railway deploy
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- **Formatting**: Biome (2-space indent, 80-char line, double quotes)
- **Imports**: Preserve import order (no auto-sorting)
- **Types**: TypeScript everywhere with explicit types
- **Naming**: camelCase (variables/functions), PascalCase (types/components)
- **Error Handling**: Try/catch for async, typed errors
- **React**: Function components, hooks, TanStack patterns

## 📚 Documentation

- [API Documentation](https://docs.contentagen.dev/api)
- [User Guide](https://docs.contentagen.dev/guide)
- [SDK Documentation](https://docs.contentagen.dev/sdk)
- [Contributing Guide](CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific package
npm run test -- packages/api

# Run tests in watch mode
npm run test:watch
```

## 📊 Performance

- **API Response Time**: <100ms average
- **Content Generation**: <30 seconds for 1000-word articles
- **Concurrent Users**: Supports 1000+ simultaneous users
- **Database Queries**: Optimized with proper indexing

## 🔒 Security

- **Authentication**: Secure JWT-based auth with Better Auth
- **API Security**: Rate limiting, input validation, CORS
- **Data Protection**: Encrypted sensitive data at rest
- **Access Control**: Role-based permissions system

## 📄 License

Licensed under the Apache License 2.0. See [LICENSE.md](LICENSE.md) for details.

## 🙏 Acknowledgments

- Built with [Nx](https://nx.dev) for monorepo management
- UI components powered by [shadcn/ui](https://ui.shadcn.com)
- AI integration via [OpenRouter](https://openrouter.ai)
- Database ORM by [Drizzle](https://orm.drizzle.team)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/contentagen/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/contentagen/discussions)
- **Email**: support@contentagen.dev

---

<p align="center">
  <strong>ContentaGen</strong> - AI-powered content generation made simple
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#contributing">Contributing</a>
</p>
