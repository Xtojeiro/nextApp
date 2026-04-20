# Análise Completa do Projeto NextApp

## 1. Visão Geral do Projeto

### Tipo de Aplicação
- **Aplicação Mobile First** usando React Native com Expo
- **App desportiva multi-role** para gestão de atletas, treinadores e olheiros
- **Backend as a Service (BaaS)**: Convex (base de dados cloud com serverless functions)
- **Suporte a múltiplas plataformas**: iOS, Android e Web

### Tecnologias Principais

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| Framework Mobile | Expo SDK | 54.x |
| Runtime | React Native | 0.81.5 |
| Backend/DB | Convex | 1.31.6 |
| Estado Global | React Context + Hooks | - |
| Navegação | expo-router + React Navigation | 6.x / 7.x |
| UI | React Native StyleSheet | - |
| i18n | i18next + react-i18next | 25.x / 16.x |
| Auth | Convex Auth + AsyncStorage | - |
| Storage | Convex Storage | - |

---

## 2. Estrutura do Projeto

```
nextApp/
├── app/                          # Rotas e páginas (expo-router)
│   ├── _layout.tsx              # Layout raiz com providers
│   ├── login.tsx                # Página de login
│   ├── register.tsx             # Página de registo
│   ├── (tabs)/                 # Grupo de tabs
│   │   ├── _layout.tsx         # Layout de tabs
│   │   ├── dashboard.tsx       # Dashboard principal
│   │   ├── treinos.tsx          # Gestão de treinos
│   │   ├── jogos.tsx            # Gestão de jogos
│   │   ├── index.tsx            # Feed/notícias
│   │   ├── chat.tsx             # Chat/mensagens
│   │   └── profile.tsx          # Perfil do utilizador
│   ├── (jogador)/              # Grupo específico para jogadores
│   ├── (treinador)/             # Grupo específico para treinadores
│   └── (olheiro)/                # Grupo específico para olheiros
│
├── components/                    # Componentes reutilizáveis
│   ├── CoachDashboard.tsx       # Dashboard do treinador
│   ├── CoachAnalytics.tsx       # Analytics do treinador
│   ├── DashboardStats.tsx       # Estatísticas do dashboard
│   ├── EvolutionChart.tsx       # Gráfico de evolução
│   ├── Header.tsx               # Cabeçalho reutilizável
│   ├── LoadingSpinner.tsx       # Spinner de loading
│   ├── PDFReportGenerator.tsx   # Gerador de relatórios PDF
│   ├── StatsComparison.tsx       # Comparação de estatísticas
│   ├── TeamComparison.tsx       # Comparação de equipas
│   └── UnifiedCalendar.tsx      # Calendário unificado
│
├── convex/                       # Backend Convex
│   ├── schema.ts               # Definição do schema da BD
│   ├── users.ts                # Queries e mutations de utilizadores
│   ├── workouts.ts             # Gestão de treinos
│   ├── games.ts                # Gestão de jogos
│   ├── events.ts               # Calendário/eventos
│   ├── chat.ts                 # Sistema de chat
│   ├── follows.ts              # Sistema de follows
│   ├── scout.ts                # Olheiros e relatórios
│   ├── achievements.ts          # Sistema de conquistas
│   ├── notifications.ts         # Sistema de notificações
│   ├── attendance.ts            # Presenças
│   ├── injuries.ts              # Lesões
│   ├── gameStats.ts             # Estatísticas de jogos
│   ├── groupConversations.ts    # Conversas de grupo
│   ├── trainingPlans.ts         # Planos de treino
│   ├── seasons.ts               # Épocas/desafios
│   ├── posts.ts                 # Publicações/posts
│   ├── invites.ts               # Convites
│   └── auth.config.ts           # Configuração de autenticação
│
├── hooks/                        # Custom hooks
│   ├── useAuth.tsx             # Context de autenticação
│   └── useTheme.tsx            # Context de tema (light/dark)
│
├── navigation/                  # Navegadores
│   ├── AppNavigator.tsx        # Navegador principal
│   ├── JogadorNavigator.tsx    # Navegador de jogador
│   ├── TreinadorNavigator.tsx  # Navegador de treinador
│   └── OlheiroNavigator.tsx    # Navegador de olheiro
│
├── types/                        # Definições de tipos TypeScript
│   └── user.ts                # Tipos para utilizador
│
├── utils/                       # Utilitários
│   └── i18n.ts                # Configuração de i18n
│
├── assets/                      # Recursos estáticos
│   ├── images/                 # Imagens do app
│   └── locales/                # Ficheiros de tradução
│       ├── en.json            # Inglês
│       ├── pt.json             # Português
│       └── es.json             # Espanhol
│
├── db.sql                       # Script SQL (para referência)
├── dbdiagram.dbml              # Diagrama da BD (DBML)
└── app.json                    # Configuração Expo
```

---

## 3. Base de Dados (Convex Schema)

### Tabelas Principais

#### 3.1 Tabela `users` (Utilizadores)
```
- _id: Id
- full_name: string
- email: string (indexado)
- password_hash: string (opcional)
- role: "PLAYER" | "COACH" | "SCOUT" (indexado)
- avatar: string (opcional)
- bio: string (opcional)
- location: string (opcional)
- age: number (opcional)
- gender: "male" | "female" | "other" (opcional)
- push_token: string (opcional)
- is_active: boolean
- is_public: boolean (opcional)
- created_at: number
- updated_at: number
```

#### 3.2 Tabela `players` (Perfil de Jogador)
```
- userId: Id → users (indexado)
- height: number (opcional)
- weight: number (opcional)
- position: string (opcional)
- dominantHand: "left" | "right" (opcional)
- teamId: Id → teams (opcional, indexado)
- coachId: Id → users (opcional, indexado)
- stats: object { gamesPlayed, wins, losses, points, assists, rebounds }
```

#### 3.3 Tabela `coaches` (Perfil de Treinador)
```
- userId: Id → users (indexado)
- certification: string (opcional)
- experience: number (opcional)
- specialization: array<string> (opcional)
- teamId: Id → teams (opcional, indexado)
```

#### 3.4 Tabela `teams` (Equipas)
```
- name: string
- description: string (opcional)
- logo: string (opcional)
- coachId: Id → users (indexado)
- createdAt: number
- updatedAt: number
```

#### 3.5 Tabela `workouts` (Treinos)
```
- user_id: Id → users (indexado)
- name: string
- description: string (opcional)
- type: string (opcional)
- duration_minutes: number (opcional)
- objective: string (opcional)
- scheduledDate: number (opcional)
- difficulty: "beginner" | "intermediate" | "advanced"
- status: "scheduled" | "in_progress" | "completed" | "skipped"
- created_at: number
```

#### 3.6 Tabela `workoutLogs` (Log de Treinos)
```
- userId: Id → users (indexado)
- workoutId: Id → workouts (indexado)
- completedDate: number (indexado)
- duration: number
- exercises: array<{ name, sets, reps, weight, duration }>
- notes: string (opcional)
```

#### 3.7 Tabela `games` (Jogos)
```
- name: string
- team1Id: Id → teams (indexado)
- team2Id: Id → teams (indexado)
- date: number (indexado)
- location: string
- status: "scheduled" | "in_progress" | "completed" | "cancelled" (indexado)
- score1: number (opcional)
- score2: number (opcional)
- notes: string (opcional)
- createdBy: Id → users
- createdAt: number
- updatedAt: number
```

#### 3.8 Tabela `events` (Eventos/Calendário)
```
- title: string
- description: string (opcional)
- date: string (indexado)
- start_time: string
- end_time: string
- location: string (opcional)
- type: "game" | "training" | "meeting" | "other"
- user_id: Id → users (indexado)
- notes: string (opcional)
- created_at: number
```

#### 3.9 Tabela `conversations` (Conversas)
```
- user_one_id: Id → users
- user_two_id: Id → users
- last_message: string (opcional)
- last_message_at: number (opcional)
- created_at: number
- updated_at: number (opcional)
```

#### 3.10 Tabela `messages` (Mensagens)
```
- conversation_id: Id → conversations (indexado)
- sender_id: Id → users
- content: string
- created_at: number
- is_read: boolean
```

#### 3.11 Tabela `scoutReports` (Relatórios de Olheiro)
```
- scoutId: Id → users (indexado)
- athleteId: Id → users (indexado)
- content: string
- rating: number (opcional)
- position: string (opcional)
- strengths: array<string> (opcional)
- weaknesses: array<string> (opcional)
- createdAt: number
```

#### 3.12 Tabela `notifications` (Notificações)
```
- userId: Id → users (indexado)
- type: "message" | "invite" | "game" | "workout" | "follow" | "report"
- title: string
- body: string (opcional)
- data: string (opcional) - JSON
- isRead: boolean (indexado)
- createdAt: number (indexado)
```

#### 3.13 Tabelas Adicionais
- `follows` - Sistema de follows
- `posts` - Publicações
- `achievements` - Conquistas/definições
- `userAchievements` - Conquistas por utilizador
- `injuries` - Registo de lesões
- `attendance` - Presenças em eventos
- `groupConversations` - Conversas de grupo
- `groupMembers` - Membros de grupos
- `groupMessages` - Mensagens de grupo
- `trainingPlans` - Planos de treino
- `seasons` - Épocas
- `league` - Liga
- `leagueTeams` - Equipas na liga
- `blockedUsers` - Utilizadores bloqueados
- `invites` - Convites

---

## 4. Funcionalidades Implementadas

### 4.1 Autenticação

**Registo:**
- Registo em 3 passos (dados pessoais → tipo de conta → credenciais)
- 3 tipos de conta: Jogador, Treinador, Olheiro
- Validação de email e password (mínimo 8 caracteres)
- Hash de password com SHA-256

**Login:**
- Autenticação por email/password
- Redirecionamento baseado no tipo de conta
- Manutenção de sessão com AsyncStorage

**Gestão de Conta:**
- Logout
- Eliminar conta (com cascade delete de dados relacionados)
- Alterar tema (light/dark)
- Alterar idioma (PT/EN/ES)
- Toggle de visibilidade do perfil (público/privado)

### 4.2 Dashboard

**Para Jogadores:**
- Estatísticas: total treinos, jogos, frequência semanal/mensal
- Streak atual e melhor streak
- Mapa de calor de atividade (últimos 122 dias)
- Calendário com vista mensal/semanal/diária
- Criação/edição/eliminação de eventos
- Tipos de evento: treino, jogo, médico

**Para Treinadores:**
- Dashboard do Coach com:
  - Total atletas
  - Atletas ativos/inativos
  - Alertas de baixa atividade
  - Próximos eventos (treinos/jogos)
  - Lista de atletas ativos

### 4.3 Sistema de Treinos

**Gestão de Treinos:**
- Criar treino (nome, tipo, duração, objetivo)
- Tipos: ginásio, futebol
- Estados: planeado, em progresso, concluído
- Cronómetro durante treino
- Formulários de conclusão específicos por tipo:
  - Ginásio: exercícios, séries, reps, peso, RPE, sensação muscular
  - Futebol: tipo sessão, distância, intensidade, posição

### 4.4 Sistema de Jogos

**Gestão de Jogos:**
- Criar jogo (adversário, local, data, hora, casa/fora)
- Registar resultado
- Estatísticas de desempenho: minutos, posição, golos, assistências
- Análise e notas

### 4.5 Chat/Mensagens

**Funcionalidades:**
- Lista de conversas
- Mensagens em tempo real
- Nova conversa com pesquisa de utilizadores
- Marcar mensagens como lidas
- Bloquear/desbloquear utilizadores
- Contador de mensagens não lidas

### 4.6 Sistema de Social

**Follow:**
- Seguir/deixar de seguir utilizadores
- Lista de seguidores e seguintes
- Pesquisar utilizadores públicos

**Perfil:**
- Editar nome e bio
- Alterar foto de perfil (upload para Convex Storage)
- Estatísticas de followers/following
- Conquistas

### 4.7 Olheiros

**Funcionalidades:**
- Pesquisar atletas com filtros avançados (posição, idade, localização)
- Criar relatórios de scouting
- Avaliações com ratings
- Pontos fortes e fracos

### 4.8 Sistema de Notificações

**Tipos:**
- message
- invite
- game
- workout
- follow
- report

**Funcionalidades:**
- Listar notificações
- Marcar como lida
- Marcar todas como lidas
- Apagar notificações lidas

---

## 5. Arquitetura de Frontend

### 5.1 Providers (Contextos)
```
├── ConvexProvider    → Acesso ao backend Convex
├── AuthProvider      → Estado de autenticação
└── ThemeProvider     → Tema e cores (light/dark)
```

### 5.2 Custom Hooks

**useAuth:**
- `user`: Dados do utilizador logado
- `accountType`: Tipo de conta em PT
- `isLoading`: Estado de loading
- `login()`: Login com email/password
- `register()`: Registo de novo utilizador
- `logout()`: Terminar sessão
- `refreshUser()`: Atualizar dados do utilizador

**useTheme:**
- `isDarkMode`: Booleano para tema escuro
- `toggleDarkMode()`: Alternar tema
- `colors`: Objeto com todas as cores do tema atual

### 5.3 Navegação

**Estrutura de Rotas:**
```
/login                 → Login
/register              → Registo
/(tabs)               → Grupo de tabs (após login)
  ├── dashboard        → Dashboard
  ├── treinos          → Treinos (apenas jogadores)
  ├── jogos            → Jogos (apenas jogadores)
  ├── index            → Feed
  ├── chat             → Chat
  └── profile           → Perfil
/(jogador)            → Grupo dedicado a jogadores
/(treinador)          → Grupo dedicado a treinadores
/(olheiro)             → Grupo dedicado a olheiros
```

**Tabs por Tipo de Conta:**
| Tab | Jogador | Treinador | Olheiro |
|-----|---------|-----------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Treinos | ✅ | ❌ | ❌ |
| Jogos | ✅ | ❌ | ❌ |
| Feed | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ |
| Perfil | ✅ | ✅ | ✅ |

---

## 6. API Backend (Convex)

### 6.1 Queries (Leitura)
- `users.getCurrentUser()` - Obter utilizador atual
- `users.getPlayerStats()` - Estatísticas do jogador
- `users.getCoachDashboard()` - Dashboard do treinador
- `users.getTeamAthletes()` - Atletas da equipa
- `users.searchUsers()` - Pesquisar utilizadores
- `users.getProfileVisibility()` - Visibilidade do perfil
- `workouts.getWorkouts()` - Listar treinos
- `workouts.getWorkoutLogs()` - Logs de treino
- `games.getGames()` - Listar jogos
- `games.getMyTeamGames()` - Jogos da equipa
- `events.getEvents()` - Listar eventos
- `events.getTeamEvents()` - Eventos da equipa
- `chat.getConversations()` - Listar conversas
- `chat.getMessages()` - Mensagens de uma conversa
- `chat.searchUsersToMessage()` - Pesquisar para chat
- `chat.getBlockedUsers()` - Utilizadores bloqueados
- `follows.getFollowers()` - Seguidores
- `follows.getFollowing()` - A seguir
- `follows.isFollowing()` - Verificar follow
- `scout.getObservedAthletes()` - Atletas observados
- `scout.getFeaturedAthletes()` - Atletas em destaque
- `scout.searchAthletesAdvanced()` - Pesquisa avançada
- `achievements.getAll()` - Todas as conquistas
- `achievements.getByUserId()` - Conquistas do utilizador
- `notifications.getByUserId()` - Notificações
- `notifications.getUnreadCount()` - Contador não lidas

### 6.2 Mutations (Escrita)
- `users.loginUser()` - Login
- `users.registerUser()` - Registo
- `users.updateUser()` - Atualizar perfil
- `users.toggleProfileVisibility()` - Alternar visibilidade
- `users.deleteAccount()` - Apagar conta
- `users.generateUploadUrl()` - URL para upload
- `users.updateAvatar()` - Atualizar avatar
- `workouts.createWorkout()` - Criar treino
- `workouts.startWorkout()` - Iniciar treino
- `workouts.completeWorkout()` - Concluir treino
- `games.createGame()` - Criar jogo
- `games.updateGame()` - Atualizar jogo
- `events.createEvent()` - Criar evento
- `events.updateEvent()` - Atualizar evento
- `events.deleteEvent()` - Apagar evento
- `chat.sendMessage()` - Enviar mensagem
- `chat.createConversation()` - Criar conversa
- `chat.markMessagesAsRead()` - Marcar como lido
- `chat.blockUser()` - Bloquear utilizador
- `chat.unblockUser()` - Desbloquear utilizador
- `follows.followUser()` - Seguir
- `follows.unfollowUser()` - Deixar de seguir
- `scout.createScoutReport()` - Criar relatório
- `achievements.create()` - Criar conquista
- `achievements.award()` - Atribuir conquista
- `notifications.create()` - Criar notificação
- `notifications.markAsRead()` - Marcar como lida

---

## 7. Internacionalização (i18n)

### Idiomas Suportados
- Português (pt) - Default
- Inglês (en)
- Espanhol (es)

### Estrutura das Traduções
```
├── settings
│   ├── appearance
│   ├── language
│   ├── account
│   ├── security
│   └── privacy
├── auth
│   ├── login
│   └── register
├── tabs
├── feed
├── treinos
├── profile
├── dashboard
└── common
```

---

## 8. Tema (Design System)

### Cores (Light Mode)
```
bg: #f8fafc
surface: #ffffff
text: #1e293b
textMuted: #64748b
border: #e2e8f0
primary: #3b82f6 (azul)
success: #10b981 (verde)
warning: #f59e0b (amarelo)
danger: #ef4444 (vermelho)
```

### Cores (Dark Mode)
```
bg: #0f172a
surface: #1e293b
text: #f1f5f9
textMuted: #94a3b8
border: #334155
primary: #60a5fa (azul claro)
success: #34d399 (verde claro)
warning: #fbbf24 (amarelo claro)
danger: #f87171 (vermelho claro)
```

### Gradients Disponíveis
- background
- surface
- primary
- success
- warning
- danger
- muted
- empty

---

## 9. Dependências Principais

### Production Dependencies
| Pacote | Descrição |
|--------|-----------|
| expo | SDK principal do Expo |
| expo-router | Sistema de routing baseado em ficheiros |
| react-native | Runtime React Native |
| convex | Backend as a Service |
| @react-navigation | Navegação React Native |
| i18next | Internacionalização |
| expo-linear-gradient | Gradientes |
| expo-image | Manipulação de imagens |
| expo-image-picker | Seletor de imagens |
| expo-localization | Localização do dispositivo |
| react-native-reanimated | Animações |
| react-native-gesture-handler | Gestos |
| @react-native-async-storage | Storage local |
| bcryptjs | Hash de passwords |

### Dev Dependencies
| Pacote | Descrição |
|--------|-----------|
| typescript | Type safety |
| eslint | Linting |
| @types/react | Tipos React |

---

## 10. Configuração da App

### app.json
- **Nome:** NextApp
- **Package Android:** com.tojeiroo.NextApp
- **Bundle iOS:** com.tojeiroo.NextApp
- **Orientação:** Portrait
- **Tema UI:** Automatic (sistema)
- **Nova Arquitectura:** Enabled
- **Esquema URI:** nextapp://

### Permissions Android
- `android.permission.RECORD_AUDIO`

### Plugins Expo
- expo-router
- expo-splash-screen
- expo-image-picker

---

## 11. Estado Atual do Projeto

### Funcionalidades Completas
✅ Autenticação (login/registo)
✅ Dashboard para jogadores e treinadores
✅ Sistema de treinos com cronómetro
✅ Sistema de jogos
✅ Chat/mensagens
✅ Calendário de eventos
✅ Sistema de follows
✅ Perfil de utilizador
✅ Tema claro/escuro
✅ Internacionalização (PT/EN/ES)
✅ Upload de imagens (avatar)
✅ Olheiros e relatórios
✅ Sistema de conquistas
✅ Notificações

### Funcionalidades Parciais
⚠️ Feed/notícias - UI placeholder
⚠️ Comparações e analytics visuais
⚠️ Sistema de lesões
⚠️ Presenças
⚠️ Planos de treino

### Bugs/Pontos a Melhorar
- Layouts vazios em `(jogador)/`, `(treinador)/`, `(olheiro)/`
- Inconsistência nos nomes de algumas variáveis (mix de inglês/português)
- Alguns campos hardcoded em vez de usar i18n
- Não há validação de formulários robusta
- Não há tratamento de erros consistente
- Não há indicadores de loading para todas as operações

---

## 12. Notas de Desenvolvimento

### Como Correr Localmente
```bash
# Backend Convex
npx convex dev

# Frontend Expo
npm start
# ou
npx expo start
```

### Estrutura de Pastas
- Pasta `app/` usa convenção expo-router
- Pasta `convex/` contém código backend (TypeScript)
- Pasta `components/` contém componentes React reutilizáveis
- Pasta `hooks/` contém custom hooks/contexts

### Boas Práticas Observadas
- Uso de TypeScript para type safety
- Separação de concerns (UI/Business Logic/Data)
- Uso de Convex para backend (简化 backend)
- Custom hooks para lógica reutilizável
- Theme system centralizado
- i18n configurado e a funcionar

### Áreas que Podem Ser Melhoradas
1. Adicionar testes (unitários e E2E)
2. Implementar caching de dados
3. Adicionar estados de erro/success para todas as operações
4. Unificar estilo de código (inglês ou português)
5. Documentar APIs e componentes
6. Implementar push notifications completas
7. Adicionar offline support
8. Melhorar performance de listas com FlatList
9. Adicionar animações de transição
10. Implementar deep linking

---

## 13. Conclusão

Este é um projeto **completo e funcional** de uma aplicação mobile para gestão desportiva. O backend Convex permite um desenvolvimento rápido sem necessidade de configurar um servidor tradicional. A aplicação suporta 3 tipos de utilizadores (jogador, treinador, olheiro) com diferentes funcionalidades baseadas no perfil.

A arquitetura é bem estruturada, usando as melhores práticas de React Native e Expo. O código está maioritariamente em TypeScript, o que facilita a manutenção e desenvolvimento futuro.

**Pontos fortes:**
- Backend serverless com Convex
- Boa estrutura de código
- Suporte a múltiplas plataformas
- Sistema de autenticação completo
- UI responsiva com tema dark/light
- Suporte a i18n

**Pontos a melhorar:**
- Consistência de código (nomes de variáveis)
- Tratamento de erros
- Estados de loading
- Documentação
- Testes
