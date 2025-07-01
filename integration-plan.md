# Integration Plan: Agent Details File Upload

```mermaid
flowchart TD
  subgraph Frontend
    A[AgentDetailsPage UI] -->|Selects file + click Upload| B(POST /agents/:agentId/upload)
    B --> C[Display upload status in a Card]
  end

  subgraph Backend
    B --> D(Parse multipart with multer)
    D --> E(Upload to MinIO)
    E --> F(Update Agent record in DB with file URL)
    F --> G{Success / Error}
    G --> H[Return JSON { url, … }]
  end

  subgraph MinIO
    E --> I[(MinIO Bucket)]
  end
```

## 1. Configure MinIO client
- Add MinIO settings (endpoint, accessKey, secretKey) to [`apps/server/src/config/env.ts`](apps/server/src/config/env.ts:1)  
- Ensure MinIO service is defined in [`apps/server/docker-compose.yml`](apps/server/docker-compose.yml:1)  

## 2. Backend route
- Create [`apps/server/src/routes/agents/$agentId/upload.ts`](apps/server/src/routes/agents/$agentId/upload.ts:1)  
- Use `multer` to handle `multipart/form-data`  
- Instantiate MinIO client and upload file to bucket  
- Extend Agent schema in [`apps/server/src/schemas/agent.ts`](apps/server/src/schemas/agent.ts:1) with a `files` JSON or URL field  
- On success, save file URL in the Agent’s record and return it  

## 3. Database schema update
- Modify Drizzle schema in [`apps/server/src/schemas/agent.ts`](apps/server/src/schemas/agent.ts:1) to add `fileUrl: text`  
- Create migration  

## 4. Frontend UI
- In [`apps/dashboard/src/pages/agent-details/ui/AgentDetailsPage.tsx`](apps/dashboard/src/pages/agent-details/ui/AgentDetailsPage.tsx:1):
  - Add file input and Upload button  
  - Wrap upload area and file list in a Card component  
  - On upload, call `POST /agents/:agentId/upload` and display returned URL in the Card  

## 5. Testing
- Start server and dashboard  
- Upload a sample file  
- Verify file in MinIO bucket, DB record updated, UI shows card with link