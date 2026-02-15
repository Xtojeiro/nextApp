# 📋 Tarefas do Projeto - Atualizado 09/02/2026

> **Legenda:**
> - `[ ]` - Por fazer
> - `[/]` - Em progresso
> - `[x]` - Concluído

---

## 🔴 PROBLEMAS CRÍTICOS DE SEGURANÇA (Concluído 09/02/2026)

> ✅ **CORRIGIDO:** Problemas graves resolvidos!

### SEC.1 Sistema de Autenticação Quebrado 🚨
- [x] Login ignora password completamente (`hooks/useAuth.tsx` linha 69-92)
- [x] Register usa dados mock em vez do backend (`hooks/useAuth.tsx` linha 94-112)
- [x] `ctx.auth.getUserIdentity()` retorna sempre null (WorkOS não integrado)
- [x] Implementar Convex Auth com Email/Password

### SEC.2 Passwords em Texto Plano 🚨
- [x] `users.ts` linha 58: password guardada sem hash
- [x] Criar hash com SHA-256 no backend
- [x] Migrar passwords existentes (validação adicionada)

### SEC.3 Validação de Inputs
- [x] Adicionar validação de email format
- [x] Adicionar validação de password strength (min 8 chars)
- [x] Confirmar password no registo
- [x] Sanitizar inputs de texto no backend

---

## 🟠 PROBLEMAS DE ARQUITETURA

### ARQ.1 Tipos Inconsistentes
- [x] Mudar `user_id: v.string()` para `v.id("users")` em `workouts`, `events`, `posts`, `follows`
- [ ] Unificar interface `User` (duplicada em `types/user.ts` e `hooks/useAuth.tsx`)
- [ ] Consistência snake_case vs camelCase no schema

### ARQ.2 Performance - Queries N+1
- [ ] Otimizar `games.ts` getGames (3 queries por jogo)
- [ ] Otimizar `chat.ts` getConversations
- [ ] Adicionar batch loading

### ARQ.3 Índices em Falta
- [x] `workouts`: adicionar `.index("by_user_id", ["user_id"])`
- [x] `posts`: adicionar `.index("by_user_id", ["user_id"])`
- [x] `follows`: adicionar `.index("by_follower_id", ["follower_id"])` e `.index("by_following_id", ["following_id"])`

### ARQ.4 Navegação Desintegrada
- [ ] Migrar `navigation/*.tsx` para estrutura expo-router
- [ ] Ou remover ficheiros redundantes


---

## 🔥 Sistema de Navegação por Tipo de Conta ✅ CONCLUÍDO

### NAV.1 Tipos TypeScript ✅
- [x] Criar enum `AccountType` com valores `JOGADOR`, `TREINADOR`, `OLHEIRO`
- [x] Criar interface `User` com todos os campos da tabela users

### NAV.2 AuthContext ✅
- [x] Criar contexto que usa `useQuery(api.users.getCurrentUser)`
- [x] Mapear `role` do Convex para `accountType` local

### NAV.3-5 Navegadores ✅
- [x] `AppNavigator.tsx`, `JogadorNavigator.tsx`, `TreinadorNavigator.tsx`, `OlheiroNavigator.tsx`

### NAV.6-7 Screens ✅
- [x] Screens Jogador: `dashboard.tsx`, `treinos.tsx`, `jogos.tsx`
- [x] Screens Treinador: `equipa.tsx`, `planeamento.tsx`, `analise.tsx`

---

## 🎯 FASE 0: Backend Convex ✅ MAIOR PARTE CONCLUÍDA

### Segurança 🔴
- [ ] Hash de passwords (bcrypt via action)
- [ ] Validar auth em queries/mutations
- [ ] Usar `ctx.auth.getUserIdentity()` corretamente

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
| SEC | Segurança | 11 | 11 |
| ARQ | Arquitetura | 9 | 6 |
| NAV | Navegação | 27 | 27 |
| Fase 0 | Backend | 42 | 39 |
| Fase 1-3 | Features | 15 | 15 |
| Fase 4 | UX/UI | 5 | 0 |
| Fase 5 | Avançadas | 3 | 0 |

**Total:** ~112 tarefas  
**Concluídas:** 87  
**Progresso:** 78%

---

## 🚀 Ordem de Implementação Atualizada

1. **ARQ** - Resolver problemas de arquitetura restantes ⬅️ **PRÓXIMO**
2. **Fase 4** - Melhorias UX
3. **Fase 5** - Features avançadas

---

## 📁 Componentes Criados

### Gráficos e Stats
- `components/EvolutionChart.tsx` - Gráfico de evolução temporal
- `components/StatsComparison.tsx` - Comparação semana/mês
- `components/DashboardStats.tsx` - Estatísticas rápidas
- `components/UnifiedCalendar.tsx` - Calendário unificado

### Análise Treinador
- `components/CoachAnalytics.tsx` - Rankings e top performers
- `components/TeamComparison.tsx` - Comparação multi-atleta
- `components/PDFReportGenerator.tsx` - Export PDF/CSV

### Navegação
- `navigation/AppNavigator.tsx` - Router principal
- `navigation/JogadorNavigator.tsx` - Bottom tabs Jogador
- `navigation/TreinadorNavigator.tsx` - Bottom tabs Treinador
- `navigation/OlheiroNavigator.tsx` - Bottom tabs Olheiro

---

*Última atualização: 09/02/2026 - Segurança corrigida (87 tarefas, 78%)*