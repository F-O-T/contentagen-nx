---
title: SDK Setup
description: How to install and initialize the ContentaGen SDK.
---

## Installation
Install the SDK:
```bash
npm install @contentagen/sdk
```

## Environment Setup
Add your API key and agent ID to your `.env` file:
```
CONTENTAGEN_API_KEY=your-api-key
CONTENTAGEN_AGENT_ID=your-agent-id
```

## Initialization
Initialize the SDK in your project (AstroJS example with typed env):
```ts
import { createSdk } from "@contentagen/sdk";
// Use Astro's typed server environment
const { CONTENTAGEN_API_KEY, CONTENTAGEN_AGENT_ID } = Astro.env;
export const sdk = createSdk({ apiKey: CONTENTAGEN_API_KEY });
export const agentId = CONTENTAGEN_AGENT_ID;
```
