# Server Setup Guide

This guide will help you set up the server environment for the Content Writer application with file upload functionality.

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (or Podman)
- Bun package manager

## Environment Configuration

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in `.env`:**

### Required Services

#### Database (PostgreSQL with pgvector)
```env
DATABASE_URL=postgres://postgres:password@localhost:5432/postgres
```

#### Redis
```env
REDIS_URL=redis://localhost:6379
```

#### MinIO (S3-Compatible Storage)
```env
# Note: Endpoint should be hostname:port without http:// prefix
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=content-writer
```

### Configure CORS for Direct Browser Access
To allow your front-end to fetch files directly from MinIO, enable CORS:

1. Install the MinIO client (mc):
   ```bash
   brew install minio/stable/mc  # or download from https://min.io/docs/minio/linux/reference/minio-mc.html
   ```
2. Create an alias for your local MinIO server:
   ```bash
   mc alias set local http://localhost:9000 minioadmin minioadmin123
   ```
3. Apply a CORS policy to your bucket:
   ```bash
   mc admin cors set local/content-writer CORS.json
   ```
4. Example CORS.json:
   ```json
   {
     "Version":"1",
     "Statement":[
       {
         "Action":["s3:GetObject"],
         "Effect":"Allow",
         "Principal":["*"],
         "Resource":["arn:aws:s3:::content-writer/*"],
         "Condition":{
           "StringLike":{
             "aws:Referer":["http://localhost:5173","http://localhost:3000"]
           }
         }
       }
     ]
   }
   ```
This configuration allows GET requests from your local front-end origins.

#### Authentication
```env
BETTER_AUTH_SECRET=your-super-secret-key-here-change-this-in-production
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### External APIs
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
POLAR_ACCESS_TOKEN=polar_xxxxxxxxxxxxxxxxxxxxxxxxxx
POLAR_SUCCESS_URL=http://localhost:3000/success
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Queue UI
```env
AP_QUEUE_UI_USERNAME=admin
AP_QUEUE_UI_PASSWORD=secure-password-change-this
```

## Starting Services

### Using Docker Compose
```bash
# Start all services (PostgreSQL, Redis, MinIO)
docker-compose up -d

# Or if using Podman
podman-compose up -d
```

### Using the dev script
```bash
# This will automatically start services and run the dev server
bun run dev
```

## Service Access

- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin123`
  
- **Database**: localhost:5432
- **Redis**: localhost:6379
- **Server**: http://localhost:8000

## File Upload Configuration

The server is configured to handle file uploads through MinIO object storage:

- **Upload Endpoint**: `POST /api/v1/agents/:agentId/upload`
- **Supported Files**: `.md` (Markdown files)
- **Storage**: MinIO bucket named `content-writer`
- **File Access**: Files are accessible via MinIO URLs

## Development Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Generate database schema
bun run generate

# Push database schema
bun run push

# Run database studio
bun run studio

# Type checking
bun run typecheck
```

## Troubleshooting

### MinIO Connection Issues
- Ensure MinIO is running: `docker ps | grep minio`
- Check MinIO logs: `docker logs <minio-container-id>`
- Verify bucket exists in MinIO console

### Database Connection Issues
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify DATABASE_URL format and credentials

### File Upload Issues
- Check MinIO endpoint configuration (no `http://` prefix in MINIO_ENDPOINT)
- Verify file permissions and bucket policies