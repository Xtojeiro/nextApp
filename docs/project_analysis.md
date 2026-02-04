# 📊 Análise do Projeto - Plataforma de Gestão Desportiva

**Data:** 27/01/2026  
**Versão:** 3.0

---

## 🔴 DESCOBERTA CRÍTICA

### O Backend Convex NÃO ESTÁ IMPLEMENTADO!

O diretório `nextapp/convex/` contém apenas o **template inicial** do Convex:

| Ficheiro | Conteúdo Atual |
|----------|----------------|
| `schema.ts` | Só tabela `numbers` de exemplo |
| `myFunctions.ts` | Funções de exemplo (`listNumbers`, `addNumber`) |
| `auth.config.ts` | Configuração WorkOS ✅ |

**O frontend referencia 42+ funções que NÃO EXISTEM.**

---

## 📊 APIs Referenciadas vs Estado Atual

### Módulo `users` ❌ NÃO EXISTE
Usado por: `_layout.tsx`, `register.tsx`, `profile.tsx`, `dashboard.tsx`, etc.

| API | Estado |
|-----|--------|
| `api.users.getCurrentUser` | ❌ |
| `api.users.registerUser` | ❌ |
| `api.users.updateUser` | ❌ |
| `api.users.generateUploadUrl` | ❌ |
| `api.users.updateAvatar` | ❌ |
| `api.users.toggleProfileVisibility` | ❌ |
| `api.users.getProfileVisibility` | ❌ |
| `api.users.searchUsers` | ❌ |
| `api.users.getTeamAthletes` | ❌ |
| `api.users.addAthleteNote` | ❌ |
| `api.users.getPlayerStats` | ❌ |
| `api.users.getCoachDashboard` | ❌ |

### Módulo `workouts` ❌ NÃO EXISTE
Usado por: `treinos.tsx`

| API | Estado |
|-----|--------|
| `api.workouts.getWorkouts` | ❌ |
| `api.workouts.createWorkout` | ❌ |
| `api.workouts.startWorkout` | ❌ |
| `api.workouts.completeWorkout` | ❌ |

### Módulo `chat` ❌ NÃO EXISTE
Usado por: `chat.tsx`

| API | Estado |
|-----|--------|
| `api.chat.getConversations` | ❌ |
| `api.chat.getMessages` | ❌ |
| `api.chat.sendMessage` | ❌ |
| `api.chat.markMessagesAsRead` | ❌ |
| `api.chat.blockUser` | ❌ |
| `api.chat.unblockUser` | ❌ |
| `api.chat.getBlockedUsers` | ❌ |

### Outros Módulos ❌ NÃO EXISTEM
- `games` - jogos
- `events` - eventos calendário
- `trainingPlans` - planos treino
- `follows` - seguidores
- `posts` - publicações

---

## 📈 ESTADO DO FRONTEND

O frontend está desenvolvido e referencia corretamente as APIs, mas estas não existem.

### Páginas Implementadas
| Página | Linhas | Estado |
|--------|--------|--------|
| `dashboard.tsx` | 1270+ | ✅ UI pronta, aguarda backend |
| `treinos.tsx` | 968 | ✅ UI pronta, aguarda backend |
| `jogos.tsx` | 752 | ✅ UI pronta, aguarda backend |
| `planeamento.tsx` | 861 | ✅ UI pronta, aguarda backend |
| `chat.tsx` | 467 | ✅ UI pronta, aguarda backend |
| `profile.tsx` | 589 | ✅ UI pronta, aguarda backend |
| `equipa.tsx` | 567 | ✅ UI pronta, aguarda backend |
| `analise.tsx` | 342 | ✅ UI pronta, aguarda backend |
| `index.tsx` | 325 | ✅ UI pronta, aguarda backend |

---

## 📁 Estrutura Convex Necessária

```
nextapp/convex/
├── _generated/          # Auto-gerado
├── auth.config.ts       # ✅ Existe
├── schema.ts            # ❌ Recriar completamente
├── users.ts             # ❌ Criar (12 funções)
├── workouts.ts          # ❌ Criar (4 funções)
├── chat.ts              # ❌ Criar (7 funções)
├── games.ts             # ❌ Criar (3 funções)
├── events.ts            # ❌ Criar (4 funções)
├── trainingPlans.ts     # ❌ Criar (4 funções)
├── follows.ts           # ❌ Criar (5 funções)
├── posts.ts             # ❌ Criar (3 funções)
└── helpers.ts           # ❌ Criar (funções utilitárias)
```

---

## 📊 Resumo de Progresso

| Área | Estado Anterior | Estado Real | Notas |
|------|-----------------|-------------|-------|
| **Backend Convex** | 85% | **5%** | Só template existe |
| **Autenticação** | 95% | 10% | Sem backend |
| **Atleta/Jogador** | 90% | 30% | UI pronta, sem backend |
| **Treinador** | 85% | 25% | UI pronta, sem backend |
| **Olheiro** | 30% | 10% | Nem UI nem backend |
| **Chat** | 95% | 30% | UI pronta, sem backend |
| **Frontend** | - | **90%** | Bem desenvolvido |

### **Progresso Real: ~25%** (vs ~80% anteriormente estimado)

---

## 🚀 Próximos Passos

1. **🔴 CRÍTICO:** Implementar todo o backend Convex
   - Schema completo
   - 10 módulos (~42 funções)
   - ~21 horas de trabalho estimado

2. **Funcionalidades Olheiro**

3. **Segurança**
   - Hash passwords
   - Validação auth

4. **UX/UI**
   - Loading states
   - Error handling

---

## ⏱️ Estimativa de Esforço

| Componente | Funções | Horas |
|------------|---------|-------|
| Schema | - | 2h |
| users.ts | 12 | 4h |
| workouts.ts | 4 | 2h |
| chat.ts | 7 | 3h |
| games.ts | 3 | 1h |
| events.ts | 4 | 2h |
| trainingPlans.ts | 4 | 2h |
| follows.ts | 5 | 2h |
| posts.ts | 3 | 1h |
| Segurança | - | 2h |
| **TOTAL** | **42+** | **~21h** |

---

*Última atualização: 27/01/2026*
