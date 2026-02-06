# 📋 Tarefas do Projeto - Atualizado 06/02/2026

> **Legenda:**
> - `[ ]` - Por fazer
> - `[/]` - Em progresso
> - `[x]` - Concluído

---

## ✅ PROBLEMA CRÍTICO: Resolvido (24 → 0 erros)

O backend Convex tem **0 erros de compilação** após as correções!

### Correções Aplicadas:
1. ✅ Campos renomeados no schema vs código: `full_name`, `user_id`, `duration_minutes`
2. ✅ Roles com case correto: `"PLAYER" | "COACH" | "SCOUT"`
3. ✅ Campos adicionados ao schema: `is_public`, `description`, `scheduledDate`, `difficulty`
4. ✅ Campos removidos/ajustados: `updatedAt`, `exercises`, `isPublic`

---

## 🔴 TAREFA URGENTE: Corrigir Erros TypeScript

### games.ts
- [x] Linha 70: Mudar `creator.name` → `creator.full_name`
- [x] Linha 227: Mudar `'coach'` → `'COACH'`
- [x] Linha 236: Mudar `'athlete'` → `'PLAYER'`

### users.ts
- [x] Linhas 199-204: Adicionar campo `is_public` ao schema e usar em toggle
- [x] Linha 235: Remover uso do índice `by_public` (não existe) - removida funcionalidade
- [x] Linha 241: Mudar `user.name` → `user.full_name`
- [x] Linhas 266, 320, 372: Mudar `'coach'` → `'COACH'`
- [x] Linha 397: Converter date para string ISO
- [x] Linha 398: Mudar `'userId'` → `'user_id'`

### workouts.ts
- [x] Linhas 30, 37, 78: Mudar `userId` → `user_id`
- [x] Linhas 115, 158: Mudar `workout.userId` → `workout.user_id`
- [x] Linhas 121, 167: Remover `updatedAt` (não existe no schema)
- [x] Linha 175: Mudar `workout.duration` → `workout.duration_minutes`
- [x] Linha 176: Remover `workout.exercises` (não existe no schema)

### schema.ts (Opcional)
- [x] Adicionar `is_public: v.optional(v.boolean())` à tabela `users`
- [x] Adicionar índice `.index("by_public", ["is_public"])` (removido, não usado)
- [x] Adicionar campos `description`, `scheduledDate`, `difficulty` à tabela `workouts`

---

## 🟡 PROBLEMA ANTERIOR (RESOLVIDO)

O schema e módulos básicos já foram criados e o código está agora consistente com o schema.

---

## 🎯 FASE 0: Criar Backend Convex (PRIORIDADE MÁXIMA)

### 0.1 Schema Completo 🔴
- [ ] Recriar `convex/schema.ts` com todas as tabelas:
  - [ ] `users` - utilizadores base
  - [ ] `players` - dados de jogadores
  - [ ] `coaches` - dados de treinadores
  - [ ] `workouts` - treinos
  - [ ] `workout_logs` - registos de treinos
  - [ ] `games` - jogos
  - [ ] `events` - eventos do calendário
  - [ ] `training_plans` - planos de treino
  - [ ] `conversations` - conversas
  - [ ] `messages` - mensagens
  - [ ] `blocked_users` - bloqueados
  - [ ] `follows` - seguidores
  - [ ] `posts` - publicações
  - [ ] `teams` - equipas

### 0.2 Módulo Users (`convex/users.ts`) 🔴
- [ ] `getCurrentUser` - obter utilizador via auth
- [ ] `registerUser` - registar utilizador
- [ ] `updateUser` - atualizar perfil
- [ ] `generateUploadUrl` - URL upload avatar
- [ ] `updateAvatar` - atualizar avatar
- [ ] `toggleProfileVisibility` - toggle público/privado
- [ ] `getProfileVisibility` - verificar visibilidade
- [ ] `searchUsers` - pesquisar utilizadores
- [ ] `getTeamAthletes` - atletas da equipa (coach)
- [ ] `addAthleteNote` - nota a atleta
- [ ] `getPlayerStats` - estatísticas jogador
- [ ] `getCoachDashboard` - dashboard treinador

### 0.3 Módulo Workouts (`convex/workouts.ts`) 🔴
- [ ] `getWorkouts` - listar treinos
- [ ] `createWorkout` - criar treino
- [ ] `startWorkout` - iniciar treino
- [ ] `completeWorkout` - completar treino

### 0.4 Módulo Chat (`convex/chat.ts`) 🔴
- [ ] `getConversations` - listar conversas
- [ ] `getMessages` - mensagens de conversa
- [ ] `sendMessage` - enviar mensagem
- [ ] `markMessagesAsRead` - marcar lidas
- [ ] `blockUser` - bloquear
- [ ] `unblockUser` - desbloquear
- [ ] `getBlockedUsers` - listar bloqueados

### 0.5 Módulo Games (`convex/games.ts`) 🔴
- [ ] `getGames` - listar jogos
- [ ] `createGame` - criar jogo
- [ ] `updateGame` - atualizar resultado

### 0.6 Módulo Events (`convex/events.ts`) 🔴
- [ ] `getEvents` - listar eventos
- [ ] `createEvent` - criar evento
- [ ] `updateEvent` - atualizar
- [ ] `deleteEvent` - eliminar

### 0.7 Módulo Training Plans (`convex/trainingPlans.ts`) 🔴
- [ ] `getTrainingPlans` - listar planos
- [ ] `createTrainingPlan` - criar plano
- [ ] `updateTrainingPlan` - atualizar
- [ ] `getTrainingPlanStats` - estatísticas

### 0.8 Módulo Follows (`convex/follows.ts`) 🔴
- [ ] `getFollowers` - seguidores
- [ ] `getFollowing` - seguindo
- [ ] `followUser` - seguir
- [ ] `unfollowUser` - deixar de seguir
- [ ] `isFollowing` - verificar

### 0.9 Módulo Posts (`convex/posts.ts`) 🔴
- [ ] `getPosts` - listar posts
- [ ] `createPost` - criar
- [ ] `deletePost` - eliminar

### 0.10 Segurança 🔴
- [ ] Hash de passwords (bcrypt via action)
- [ ] Validar auth em queries/mutations
- [ ] Usar `ctx.auth.getUserIdentity()` corretamente

---

## 🎯 FASE 1: Completar Atleta/Jogador

### 1.1 Estatísticas Dashboard
- [ ] Gráfico de evolução
- [ ] Comparação semana/mês anterior

### 1.2 Integração Jogos ↔ Calendário
- [ ] Sincronizar edição/eliminação

---

## 🎯 FASE 2: Completar Treinador

### 2.1 Dados Reais
- [ ] Sistema convites atleta-treinador
- [ ] Query real de atletas associados

### 2.2 Calendário Partilhado
- [ ] Treinador cria eventos para equipa
- [ ] Atletas veem eventos no calendário

### 2.3 Melhorias Análise
- [ ] Gráficos comparativos
- [ ] Exportar relatórios (PDF)

---

## 🎯 FASE 3: Implementar Olheiro

### 3.1 Dashboard do Olheiro 🔴
- [ ] Página `dashboard-scout.tsx`
- [ ] Query `getObservedAthletes`
- [ ] Query `getFeaturedAthletes`

### 3.2 Pesquisa Avançada 🔴
- [ ] Filtro por posição, idade, região
- [ ] Query `searchAthletesAdvanced`

### 3.3 Relatórios de Observação 🔴
- [ ] Backend `convex/scoutReports.ts`
- [ ] UI para criar/editar relatórios

### 3.4 Tabs do Olheiro 🔴
- [ ] Modificar `_layout.tsx` com tabs específicas

---

## 🎯 FASE 4: Melhorias UX/UI

- [ ] Loading spinners/skeleton loaders
- [ ] Empty states
- [ ] Error handling (try-catch, toasts)
- [ ] Pull-to-refresh
- [ ] Validação de formulários

---

## 🎯 FASE 5: Features Avançadas

- [ ] Notificações Push (Expo Notifications)
- [ ] Exportação de dados (PDF/CSV)
- [ ] Modo Offline

---

## 📊 Resumo de Progresso

| Fase | Descrição | Tarefas | Concluídas |
|---|---|---|---|
| Fase 0 | Backend Convex | 42 | 13 |
| Fase 1 | Atleta | 2 | 0 |
| Fase 2 | Treinador | 5 | 0 |
| Fase 3 | Olheiro | 8 | 0 |
| Fase 4 | UX/UI | 5 | 0 |
| Fase 5 | Avançadas | 3 | 0 |

**Total:** ~65 tarefas  
**Concluídas:** 13  
**Progresso:** 20%

---

## 🚀 Ordem de Implementação

1. **Fase 0** - Criar todo o backend Convex ← **COMEÇAR AQUI**
2. **Fase 3** - Olheiro
3. **Fase 4** - Melhorias UX
4. **Fase 2** - Treinador
5. **Fase 1** - Atleta
6. **Fase 5** - Features avançadas

---

*Última atualização: 27/01/2026*