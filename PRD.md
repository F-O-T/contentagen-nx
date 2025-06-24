## Product Requirements Document (PRD): Blog Automation Application

### 1. Visão Geral do Produto

Aplicação de automação para criação de conteúdo de blogs, permitindo que agências de marketing de conteúdo e blogueiros individuais definam e utilizem agentes de IA para gerar posts de blog longos e textos otimizados para SEO de forma rápida e personalizada.

### 2. Público-Alvo

- Agências de marketing de conteúdo
- Blogueiros individuais

### 3. Problemas a Resolver

- Falta de inspiração para pautas e temas
- Dificuldade em manter um calendário editorial consistente
- Qualidade de conteúdo inconsistente
- Pouco tempo disponível para escrever

### 4. Principais Funcionalidades

1. **Criação de Agente de IA**

   - Definição de tom de voz (formal, descontraído, técnico etc.)
   - Seleção de público-alvo (persona do leitor)
   - Indicação de tópicos preferenciais
   - Inserção de palavras-chave SEO
   - Escolha de estilo de formatação (subtítulos, listas, blocos de citação etc.)

2. **Fluxo de Produção de Conteúdo**

   - Tela de prompt base: usuário insere briefing e exemplo de artigo
   - Geração automática de rascunho pelo agente
   - Interface de revisão manual (edição e comentários)
   - Opção de exportação para formatos padrão (Markdown, HTML, DOCX)
   - Publicação automática em plataforma integrada (quando configurado)

3. **Gestão de Projetos e Agentes**

   - Dashboard centralizado agrupando agentes por projeto
   - Criação, renomeação e exclusão de projetos
   - Visualização rápida do status de rascunhos gerados por agente

4. **Onboarding e Templates**

   - Tutoriais passo a passo para configurar o primeiro agente
   - Conjunto de templates de briefing pré-configurados para diversos nichos (tecnologia, saúde, finanças etc.)
   - Base de conhecimento integrada para dúvidas frequentes

### 5. Fluxo de Usuário (User Flow)

1. Onboarding: tutorial guiado explica como criar e configurar um agente
2. Configuração de agente: definição de tom, público, tópicos, palavras-chave e estilo
3. Criação de briefing: usuário preenche prompt base ou escolhe template
4. Geração de rascunho: IA produz o conteúdo inicial
5. Revisão manual: usuário edita e aprova o texto
6. Exportação/Publicação: usuário baixa ou publica diretamente no blog

### 6. Critérios de Aceitação (High-Level)

- Usuário consegue criar um agente e gerar um rascunho em menos de 2 minutos
- Interface de revisão permite edição direta do texto gerado
- Exportação funciona para formatos Markdown e DOCX sem perda de formatação

### 7. Exclusões (Escopo Fora)

- Integrações automáticas com plataformas específicas (ex.: WordPress, Medium) — serão planejadas depois
- Funções avançadas de analítica ou métricas de performance de posts
- Agendamento de calendário editorial automatizado