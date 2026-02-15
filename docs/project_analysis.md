# 📊 Análise do Projeto — Plataforma de Gestão Desportiva

**Data:** 12/02/2026  
**Versão:** 4.0

---

## 🏗️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Framework** | Expo (React Native) | 54.0 |
| **Runtime** | React Native | 0.81.5 |
| **Navegação** | Expo Router + React Navigation | 7.x |
| **Backend/DB** | Convex | 1.31.6 |
| **Autenticação** | WorkOS (Custom JWT) | — |
| **Linguagem** | TypeScript | 5.9 |
| **i18n** | i18next + react-i18next | 25.x |
| **UI** | Expo Image, Linear Gradient, Haptics | — |

---

## � Estrutura do Projeto

```
nextApp/
├── app/
│   ├── _layout.tsx              # Root layout
│   ├── login.tsx                # Página de login
│   ├── register.tsx             # Página de registo
│   ├── (tabs)/                  # Tabs principais (10 páginas)
│   ├── (jogador)/               # Páginas específicas do jogador (4)
│   ├── (treinador)/             # Páginas específicas do treinador (5)
│   └── (olheiro)/               # Páginas específicas do olheiro (4)
├── components/                  # 10 componentes reutilizáveis
├── convex/                      # Backend Convex (11 módulos + schema)
├── hooks/                       # useAuth, useTheme
├── navigation/                  # 4 navigators (App, Jogador, Treinador, Olheiro)
├── types/                       # Tipos TypeScript (user.ts)
└── utils/                       # Utilitários (i18n.ts)
```

---

## ✅ Backend Convex — IMPLEMENTADO

O backend Convex está **totalmente implementado** com schema completo e 11 módulos funcionais.

### Schema (`schema.ts` — 266 linhas)

| Tabela | Descrição | Índices |
|--------|-----------|---------|
| `users` | Utilizadores base (nome, email, role, avatar, bio) | `by_email`, `by_role` |
| `players` | Dados estendidos do atleta (posição, stats, equipa) | `by_userId`, `by_teamId`, `by_coachId` |
| `coaches` | Dados estendidos do treinador (certificação, experiência) | `by_userId`, `by_teamId` |
| `teams` | Equipas (nome, logo, treinador) | `by_coachId` |
| `workouts` | Treinos (exercícios, dificuldade, status) | `by_user_id` |
| `workoutLogs` | Logs de treinos completados | `by_userId`, `by_workoutId`, `by_completedDate` |
| `games` | Jogos (equipas, resultado, status) | `by_team1Id`, `by_team2Id`, `by_date`, `by_status` |
| `events` | Eventos de calendário | `by_date`, `by_user_id` |
| `trainingPlans` | Planos de treino do treinador | `by_coachId`, `by_active` |
| `conversations` | Conversas entre utilizadores | — |
| `messages` | Mensagens de chat | `by_conversation_id` |
| `blockedUsers` | Utilizadores bloqueados | `by_blockerId`, `by_blockedId` |
| `follows` | Sistema de seguidores | `by_follower_id`, `by_following_id` |
| `posts` | Publicações sociais (likes, comentários) | `by_user_id` |
| `scoutReports` | Relatórios de olheiros | `by_scoutId`, `by_athleteId` |
| `invites` | Convites de treinador → atleta | `by_coachId`, `by_athleteId`, `by_status` |

### Módulos API (62+ funções)

| Módulo | Funções | Linhas | Estado |
|--------|---------|--------|--------|
| `users.ts` | 13 (login, register, getCurrentUser, updateUser, generateUploadUrl, updateAvatar, toggleProfileVisibility, getProfileVisibility, searchUsers, getTeamAthletes, addAthleteNote, getPlayerStats, getCoachDashboard) | 493 | ✅ |
| `chat.ts` | 7 (getConversations, getMessages, sendMessage, markMessagesAsRead, blockUser, unblockUser, getBlockedUsers) | 392 | ✅ |
| `games.ts` | 4 (getGames, createGame, updateGame, getMyTeamGames) | 278 | ✅ |
| `follows.ts` | 7 (getFollowers, getFollowing, getFollowersCount, getFollowingCount, followUser, unfollowUser, isFollowing) | 240 | ✅ |
| `scout.ts` | 6 (getObservedAthletes, getFeaturedAthletes, searchAthletesAdvanced, createScoutReport, getScoutReports, getAthleteReports) | 233 | ✅ |
| `trainingPlans.ts` | 6 (getTrainingPlans, getMyTrainingPlans, createTrainingPlan, updateTrainingPlan, addWorkoutToPlan, getTrainingPlanStats) | 229 | ✅ |
| `events.ts` | 5 (getEvents, createEvent, updateEvent, deleteEvent, getTeamEvents) | 225 | ✅ |
| `invites.ts` | 4 (createInvite, getPendingInvites, respondToInvite, getCoachInvites) | 208 | ✅ |
| `posts.ts` | 6 (getPosts, getFeed, createPost, deletePost, likePost, addComment) | 208 | ✅ |
| `workouts.ts` | 4 (getWorkouts, createWorkout, startWorkout, completeWorkout) | 178 | ✅ |
| `auth.config.ts` | Configuração WorkOS JWT | 22 | ✅ |

---

## 📱 Frontend — Páginas

### Páginas Comuns (Tabs)

| Página | Tamanho | Descrição |
|--------|---------|-----------|
| `dashboard.tsx` | 44 KB | Dashboard principal com stats por role |
| `treinos.tsx` | 32 KB | Gestão de treinos e exercícios |
| `planeamento.tsx` | 31 KB | Planos de treino e calendário |
| `jogos.tsx` | 25 KB | Listagem e gestão de jogos |
| `profile.tsx` | 21 KB | Perfil do utilizador |
| `equipa.tsx` | 20 KB | Gestão de equipa e atletas |
| `chat.tsx` | 12 KB | Sistema de mensagens |
| `analise.tsx` | 12 KB | Análise e estatísticas |
| `index.tsx` | 12 KB | Página inicial / feed |
| `_layout.tsx` | 5 KB | Layout de tabs e navegação |

### Páginas por Role

| Role | Páginas | Detalhes |
|------|---------|----------|
| **Jogador** | `dashboard.tsx` (4 KB), `jogos.tsx`, `treinos.tsx` | Visão do atleta |
| **Treinador** | `dashboard.tsx` (5 KB), `analise.tsx`, `equipa.tsx`, `planeamento.tsx` | Gestão completa |
| **Olheiro** | `dashboard.tsx` (1 KB), `pesquisar.tsx`, `relatorios.tsx` | Scouting e relatórios |

### Autenticação

| Página | Tamanho | Estado |
|--------|---------|--------|
| `login.tsx` | 4 KB | ✅ Funcional (Convex mutation) |
| `register.tsx` | 11 KB | ✅ Funcional (3 roles) |

---

## 🧩 Componentes

| Componente | Tamanho | Descrição |
|-----------|---------|-----------|
| `UnifiedCalendar.tsx` | 11 KB | Calendário integrado |
| `PDFReportGenerator.tsx` | 11 KB | Geração de relatórios PDF |
| `CoachDashboard.tsx` | 9 KB | Dashboard do treinador |
| `TeamComparison.tsx` | 8 KB | Comparação entre equipas |
| `CoachAnalytics.tsx` | 7 KB | Analytics para treinador |
| `StatsComparison.tsx` | 6 KB | Comparação de estatísticas |
| `EvolutionChart.tsx` | 4 KB | Gráfico de evolução |
| `DashboardStats.tsx` | 4 KB | Cards de estatísticas |
| `LoadingSpinner.tsx` | 1 KB | Indicador de carregamento |
| `Header.tsx` | 1 KB | Componente de cabeçalho |

---

## 🔐 Sistema de Autenticação

- **Provider:** WorkOS (Custom JWT com RS256)
- **Hook:** `useAuth.tsx` — Context API com AsyncStorage
- **Funcionalidades:** Login, Register, Logout, RefreshUser
- **Roles:** `PLAYER`, `COACH`, `SCOUT`
- **Persistência:** AsyncStorage para sessão local
- **Hash de passwords:** bcryptjs (no backend Convex)

---

## 🌍 Internacionalização

- **Biblioteca:** i18next + react-i18next
- **Localização:** expo-localization
- **Ficheiro:** `utils/i18n.ts`

---

## 📊 Resumo de Progresso

| Área | Estado | Notas |
|------|--------|-------|
| **Schema Convex** | ✅ 100% | 16 tabelas com índices |
| **Backend API** | ✅ 95% | 62+ funções implementadas |
| **Autenticação** | ✅ 90% | Login/Register funcional, WorkOS config |
| **Frontend Tabs** | ✅ 90% | 10 páginas completas |
| **Navegação por Role** | ✅ 85% | 3 navigators (Jogador, Treinador, Olheiro) |
| **Componentes** | ✅ 85% | 10 componentes reutilizáveis |
| **Chat** | ✅ 90% | Conversas, mensagens, bloqueio |
| **Sistema Social** | ✅ 85% | Posts, follows, likes, comentários |
| **Scouting** | ✅ 80% | Pesquisa avançada, relatórios |
| **i18n** | ⚠️ 40% | Config base, traduções parciais |

### **Progresso Global: ~85%**

---

## 🚀 Próximos Passos

1. **Testes e Validação**
   - Testar fluxos completos end-to-end
   - Verificar integração frontend ↔ backend

2. **UX/UI Polish**
   - Loading states consistentes
   - Error handling melhorado
   - Feedback visual (toasts, animações)

3. **Internacionalização**
   - Completar traduções PT/EN
   - Integrar i18n em todas as páginas

4. **Funcionalidades Pendentes**
   - Notificações push (push_token já no schema)
   - Upload de imagens completo
   - Admin panel

5. **Segurança**
   - Revisão de permissões por role
   - Rate limiting nas APIs
   - Validação de inputs mais robusta

---

*Última atualização: 12/02/2026*
