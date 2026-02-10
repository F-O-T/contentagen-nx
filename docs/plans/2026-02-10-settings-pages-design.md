# Settings Pages Design

> Settings structure inspired by PostHog, adapted for a CMS product (Contentta).
> Hierarchy: Organization > Teams (Projects) > Account.

---

## Removed from PostHog Template

| Page | Reason |
|------|--------|
| Proxy reverso gerenciado | No use case — PostHog-specific (ad-blocker bypass) |
| Notificações | Not needed at launch — no notification channels built |

---

## Addon-Gated Pages

These pages exist in the sidebar but show an upsell/locked state until the addon is activated.

| Page | Addon Tier |
|------|------------|
| Controle de acesso (Project) | Boost |
| Registro de atividades (Project) | Scale |
| Funções / Roles (Organization) | Boost |
| Domínios de auth & SSO (Organization) | Boost |

Locked state: show page with a brief explanation of the feature + CTA to activate the addon (like PostHog's pattern).

---

## Section 1: Projeto (Project) — Scoped to Team

### 1.1 Geral (`/settings/project/general`)

Project-level metadata and defaults.

| Field | Type | Description |
|-------|------|-------------|
| Nome do projeto | text | Display name for the team/project |
| Slug | text (readonly or editable) | URL identifier |
| Fuso horário | select | Default timezone for content scheduling and analytics |
| Moeda padrão | select | Currency for analytics/billing display |
| Chave de API pública | readonly + copy | Project public API key (for SDK embedding) |

---

### 1.2 Webhooks (`/settings/project/webhooks`)

Configure webhook endpoints to receive events from this project.

| Field | Type | Description |
|-------|------|-------------|
| Endpoints | table | URL, events subscribed, status (active/paused), last delivery |
| Criar endpoint | form | URL, secret (auto-generated), event patterns to subscribe |
| Delivery log | expandable | Per-endpoint delivery history with status codes and payloads |

---

### 1.3 Produtos > Conteudo (`/settings/project/products/content`)

Default configuration for content creation within this project.

| Field | Type | Description |
|-------|------|-------------|
| Idioma padrão | select | Default language for new content (pt-BR, en, es, etc.) |
| Agente IA padrão | select (agent picker) | Default AI agent assigned to new content |
| Fluxo de status | config | Status workflow — e.g. require review before publishing (toggle) |
| Template de meta title | text with variables | Default SEO title template (e.g. `{title} \| {brand}`) |
| Template de meta description | textarea with variables | Default SEO description template |
| Limite de versões | number | Max content versions to keep (0 = unlimited) |

---

### 1.4 Produtos > Formularios (`/settings/project/products/forms`)

Default configuration for embedded forms.

| Field | Type | Description |
|-------|------|-------------|
| Mensagem de sucesso padrão | textarea | Default message shown after form submission |
| Email de notificação | email input | Where to send new submission notifications |
| Proteção anti-spam | toggle + select | Enable captcha / honeypot |
| Double opt-in | toggle | Require email confirmation before storing lead |
| Retenção de dados | select | How long to keep form submissions (30d, 90d, 1y, unlimited) |

---

### 1.5 Produtos > Agentes IA (`/settings/project/products/ai-agents`)

Default configuration for AI generation within this project.

| Field | Type | Description |
|-------|------|-------------|
| Modelo padrão | select | Default LLM model/provider (GPT-4o, Claude, etc.) |
| Nível de criatividade | slider | Default temperature (conservative ↔ creative) |
| Provedores de pesquisa | multi-select | Which research providers are enabled (Tavily, Exa, Firecrawl) |
| Limite de tokens por requisição | number | Max tokens per AI generation request |

---

### 1.6 Integrações (`/settings/project/integrations`)

Third-party service connections for this project.

| Field | Type | Description |
|-------|------|-------------|
| Lista de integrações | cards/grid | Available integrations with connect/disconnect state |

Potential integrations: WordPress, Webflow, Ghost, Google Search Console, Google Analytics, Slack (content notifications).

---

### 1.7 Controle de Acesso (`/settings/project/access-control`) — ADDON

Per-project permission overrides. Controls who can do what within this specific project.

| Field | Type | Description |
|-------|------|-------------|
| Membros do projeto | table | Member, role in this project, actions |
| Permissões por recurso | matrix | Content (view/edit/publish/delete), Forms (view/edit/delete), Agents (view/edit) |

**Locked state:** "Controle de acesso granular permite definir quem pode fazer o quê dentro de cada projeto. Disponível com o addon Boost."

---

### 1.8 Registro de Atividades (`/settings/project/activity-logs`) — ADDON

Audit trail of all actions within this project.

| Field | Type | Description |
|-------|------|-------------|
| Log de atividades | table (filterable) | Timestamp, user, action, resource, details |
| Filtros | toolbar | By user, action type, date range |
| Retenção | info badge | Shows retention period based on addon tier (2mo / 60mo) |

**Locked state:** "O registro de atividades mantém um histórico completo de todas as ações no projeto. Disponível com o addon Scale."

---

### 1.9 Zona de Perigo (`/settings/project/danger-zone`)

Destructive project actions.

| Action | Type | Description |
|--------|------|-------------|
| Transferir projeto | button → confirmation | Move project to another organization |
| Deletar projeto | destructive button → confirmation | Permanently delete project and all its data |

---

## Section 2: Organização

### 2.1 Geral (`/settings/organization/general`)

Organization-level metadata.

| Field | Type | Description |
|-------|------|-------------|
| Nome da organização | text | Display name |
| Slug | text | URL identifier |
| Logo | image upload | Organization logo |
| Domínio | text | Primary domain (for branding, emails) |

---

### 2.2 Membros (`/settings/organization/members`)

Manage organization membership.

| Field | Type | Description |
|-------|------|-------------|
| Lista de membros | table | Name, email, role, teams, joined at, actions |
| Convidar membro | form/sheet | Email, role, team assignment |
| Convites pendentes | table | Email, invited by, date, actions (resend/revoke) |

---

### 2.3 Funções / Roles (`/settings/organization/roles`) — ADDON

Custom role definitions for the organization.

| Field | Type | Description |
|-------|------|-------------|
| Roles padrão | table (readonly) | Admin, Member, Viewer — built-in roles |
| Roles customizados | table | Name, permissions summary, member count, actions |
| Criar role | form/sheet | Name, description, permission matrix |

**Locked state:** "Funções customizadas permitem criar papéis específicos para sua organização. Disponível com o addon Boost."

---

### 2.4 Dominios de Auth & SSO (`/settings/organization/authentication`) — ADDON

SSO and authentication domain configuration.

| Field | Type | Description |
|-------|------|-------------|
| Domínios verificados | table | Domain, status (verified/pending), actions |
| Provedor SSO | config | SAML provider URL, certificate, entity ID |
| Política de login | toggles | Enforce SSO for all members, allow password fallback |

**Locked state:** "SSO e domínios de autenticação permitem controlar como seus membros fazem login. Disponível com o addon Boost."

---

### 2.5 Segurança (`/settings/organization/security`)

Organization-wide security policies.

| Field | Type | Description |
|-------|------|-------------|
| Exigir 2FA | toggle | Force all members to enable two-factor authentication |
| Timeout de sessão | select | Auto-logout after inactivity (30min, 1h, 4h, 24h, never) |
| IPs permitidos | text list | Restrict access to specific IP ranges (optional) |

---

### 2.6 Faturamento (`/$slug/billing`) — External Link

Links to the existing billing page (outside settings). Shows subscription, usage, invoices, and addon management.

---

### 2.7 Zona de Perigo (`/settings/organization/danger-zone`)

Destructive organization actions.

| Action | Type | Description |
|--------|------|-------------|
| Deletar organização | destructive button → confirmation | Permanently delete org, all projects, all data |

---

## Section 3: Conta (Account)

### 3.1 Perfil (`/settings/profile`)

Personal user information.

| Field | Type | Description |
|-------|------|-------------|
| Nome | text | Display name |
| Email | text (with verification flow) | Account email |
| Avatar | image upload | Profile picture |

---

### 3.2 Chaves de API Pessoais (`/settings/personal-api-keys`)

Personal API keys that inherit the user's permissions.

| Field | Type | Description |
|-------|------|-------------|
| Lista de chaves | table | Name, prefix, created at, last used, actions (revoke) |
| Criar chave | form | Name, expiration (optional) |

Note: Personal keys act as the user — scoped to whatever orgs/projects the user has access to.

---

### 3.3 Segurança (`/settings/security`)

Account security settings.

| Field | Type | Description |
|-------|------|-------------|
| Alterar senha | form | Current password, new password, confirm |
| Autenticação 2FA | setup/manage | Enable TOTP, show recovery codes |
| Sessões ativas | table | Device, location, last active, actions (revoke) |

---

### 3.4 Previas de Funcionalidades (`/settings/feature-previews`)

Opt-in to beta features.

| Field | Type | Description |
|-------|------|-------------|
| Features disponíveis | card list | Feature name, description, status badge, toggle |

Current betas: **Formulários (Forms)**.

Each card shows: name, short description, opt-in toggle, and a "saiba mais" link.

---

### 3.5 Personalização (`/settings/customization`)

User display and editor preferences.

| Field | Type | Description |
|-------|------|-------------|
| Tema | radio/select | Claro / Escuro / Sistema |
| Tamanho da fonte do editor | select | Pequeno / Médio / Grande |
| Modo do editor | select | Padrão / Foco (distraction-free) |
| Mascote Contentta | toggle/select | Logo easter egg — animated logo, logo with accessories, etc. |

---

### 3.6 Zona de Perigo (`/settings/danger-zone`)

Destructive account actions.

| Action | Type | Description |
|--------|------|-------------|
| Deletar conta | destructive button → confirmation | Permanently delete account and remove from all organizations |

---

## Updated Nav Items Summary

```
Projeto (Project)
├── Geral (includes public API key)
├── Webhooks
├── Produtos
│   ├── Conteúdo
│   ├── Formulários
│   └── Agentes IA
├── Integrações
├── Controle de acesso        🔒 addon
├── Registro de atividades    🔒 addon
└── Zona de perigo

Organização
├── Geral
├── Membros
├── Funções                   🔒 addon
├── Domínios de auth & SSO    🔒 addon
├── Segurança
├── Faturamento               ↗ external
└── Zona de perigo

Conta
├── Perfil
├── Chaves de API pessoais
├── Segurança
├── Prévias de funcionalidades
├── Personalização
└── Zona de perigo
```
