
# Product Requirements Document (PRD): Blog Automation Application

## 1. Visão Geral do Produto

Aplicação de automação para criação de conteúdo de blogs, permitindo que agências de marketing de conteúdo e blogueiros individuais definam e utilizem agentes de IA para gerar posts de blog longos e textos otimizados para SEO de forma rápida e personalizada.

## 2. Público-Alvo

- Agências de marketing de conteúdo
- Blogueiros individuais

## 3. Problemas a Resolver

- Falta de inspiração para pautas e temas
- Dificuldade em manter um calendário editorial consistente
- Qualidade de conteúdo inconsistente
- Pouco tempo disponível para escrever

---

### 4. Principais Funcionalidades

#### 4.1 Criação e Gestão de Agentes de IA

- **[Done]** Definição de tom de voz, público-alvo, tópicos e palavras-chave SEO.
  - *Justification: The agent creation form (`AgentCreationManualForm`) already captures these details.*
- **[Done]** Escolha de estilo de formatação (subtítulos, listas etc.).
- **[Not Done]** Configuração modular de funcionalidades (ex: ativar/desativar geração de frontmatter).
- **[Done]** Dashboard centralizado para visualizar e gerenciar todos os agentes.
  - *Justification: The `AgentListPage` component displays all agents for the user.*

#### 4.2 Fluxo de Produção de Conteúdo

- **[Done]** Tela de prompt base: usuário insere briefing para o agente.
  - *Justification: The `ContentRequestForm` handles this.*
- **[Done]** Geração automática de rascunho pelo agente.
  - *Justification: The `content-generation` worker in `apps/server` handles this process asynchronously.*
- **[Partially Done]** Interface de revisão e edição do conteúdo gerado.
  - *Justification: A read-only view exists (`GeneratedContentDisplay`), but direct editing (Tiptap) is not yet implemented.*
- **[Done]** Opção de exportação para formatos padrão (Markdown, HTML, DOCX).
  - *Justification: The `useContentExport` hook handles exports to Markdown, MDX, and HTML.*

#### 4.3 Onboarding e Templates

- **[Partially Done]** Tutoriais passo a passo para configurar o primeiro agente.
  - *Justification: The `TalkingMascot` component provides contextual guidance, which serves as a lightweight form of onboarding. A full, dedicated tutorial is not implemented.*
- **[Not Done]** Conjunto de templates de briefing pré-configurados para diversos nichos.

---

## 6. Critérios de Aceitação (High-Level)

1. **Onboarding:** Tutorial guiado explica como criar e configurar um agente. **[Partially Done]**
2. **Configuração de agente:** Definição de tom, público, tópicos e ativação de módulos específicos. **[Done]**
3. **Criação de briefing:** Usuário preenche prompt ou escolhe template. **[Done]**
4. **Geração de rascunho:** IA produz o conteúdo; usuário recebe notificações em tempo real. **[Partially Done]**
   - *Generation is done, real-time notifications are not.*
5. **Revisão e Edição:** Usuário edita o texto na plataforma. **[Partially Done]**
   - *Revision is done, editing is not.*
6. **Exportação:** Usuário baixa o conteúdo final. **[Done]**

---

## 7. Exclusões (Escopo Fora)

- **[Done]** Usuário consegue criar um agente e gerar um rascunho em menos de 2 minutos.
- **[Not Done]** A interface de revisão permite edição direta do texto gerado.
- **[Not Done]** As notificações (WebSocket, Email) são disparadas corretamente após a conclusão da geração.

---

## 8. Evolução do Produto (v2.0)

- **[Not Done]** Integrações automáticas com plataformas de publicação (ex.: WordPress).
- **[Not Done]** Funções avançadas de analítica ou métricas de performance de posts.
- **[Not Done]** Agendamento de calendário editorial automatizado.

---

### 8. Evolução do Produto (v2.0)

Esta seção detalha as novas funcionalidades e melhorias planejadas para a próxima grande versão.

#### 8.1 Configuração Avançada e Modular do Agente

**Descrição:**
Para oferecer maior controle e personalização, a página de "Detalhes do Agente" será o hub para configurar o comportamento do agente de forma modular.

**Funcionalidades:**

- **[Not Done]** **Página de Detalhes do Agente:** Nova rota (`/agents/:agentId`) para visualização e edição aprofundada.
- **[Not Done]** **Prompt Base Editável com Tiptap:** Editor rich text (Tiptap) para o prompt base de cada agente.
- **[Not Done]** **Geração Automática de Prompt Base:** Sistema gera prompt base otimizado ao criar novo agente.
- **[Not Done]** **Artigos de Referência (Guideline Posts):** Seleção de até 3 artigos existentes para guiar estilo e tom do agente.
- **[Not Done]** **Configurações Modulares (Toggles):**
  - **Frontmatter:** Ativar/desativar geração de `frontmatter` (YAML/TOML).
  - **Meta Tags & Description:** Gerar `meta tags` e `meta descriptions` otimizadas para SEO.
  - **Links Internos:** Ativar/desativar processamento da sintaxe de links internos (`[[link]]`) na exportação.

#### 8.2 Modo de Escrita Profunda (Deep Writing Mode)

**Descrição:**
Modo opcional para criação de conteúdo colaborativo entre múltiplos agentes de IA, visando artigos de altíssima qualidade.

**Funcionalidades:**

- **[Not Done]** **Ativação do Modo:** Toggle "Deep Writing Mode" no formulário de solicitação de conteúdo.
- **[Not Done]** **Fluxo de Múltiplos Agentes:**
  1. **Agente de Pesquisa:** Gera esboço detalhado do tópico.
  2. **Agentes Críticos:** Personificam o público-alvo e fornecem feedback.
  3. **Agente Escritor:** Escreve o artigo completo com base no esboço refinado.
  4. **Agente Revisor:** Revisa o rascunho final para garantir qualidade e consistência.
- **[Not Done]** **Integração com Prompt do Agente:** Personas dos agentes críticos derivadas das configurações de público-alvo e tom de voz do agente principal.

#### 8.3 Funcionalidades de Conteúdo Avançadas

- **[Not Done]** **Links Internos Aprimorados:** Sintaxe `[[link]]` reconhecida e convertida em links relativos funcionais na exportação, melhorando SEO on-page.

#### 8.4 Notificações em Tempo Real e Assíncronas

**Descrição:**
Manter o usuário informado sobre o progresso da geração de conteúdo, mesmo que ele não esteja com a aplicação aberta.

**Funcionalidades:**

- **[Not Done]** **Notificação via WebSocket:** Notificação em tempo real na UI do dashboard ao concluir geração de conteúdo.
- **[Not Done]** **Notificação via Email:** Email enviado ao usuário informando que o conteúdo está pronto para revisão.
- **[Not Done]** **Notificação Push:** Opção para receber notificações push no navegador quando o conteúdo estiver pronto.
