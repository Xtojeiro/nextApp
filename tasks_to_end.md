# Tarefas por Completar - NextApp

Lista detalhada de todas as tarefas pendentes para completar o projeto NextApp.

---

## TAREFA 001: Completar Sistema de Feed/Publicações

**Prioridade:** ALTA  
**Estado Atual:** UI placeholder existe, backend parcial  
**Ficheiros Envolvidos:** `app/(tabs)/index.tsx`, `convex/posts.ts`

### Descrição
O sistema de feed/publicações está incompleto. Apenas existe UI de pesquisa de utilizadores.

### O Que Fazer

1. **Criar Schema de Posts** (se não existir completo):
   - Verificar/adicionar campos: `content`, `image_url`, `created_at`, `likes_count`, `comments_count`
   - Adicionar indexes para `user_id` e `created_at`

2. **Desenvolver UI de Feed** em `app/(tabs)/index.tsx`:
   - Substituir o conteúdo placeholder por FlatList de publicações reais
   - Cada post deve mostrar: avatar, nome, data, conteúdo, imagem (opcional), likes, comentários
   - Adicionar botão de "Criar Publicação" (FAB)
   - Implementar pull-to-refresh

3. **Modal de Criar Publicação**:
   - TextInput multilinha para texto
   - Botão para adicionar imagem (expo-image-picker)
   - Upload da imagem para Convex Storage
   - Mutation para criar post

4. **Funcionalidades de Post**:
   - Like/unlike (mutation + query)
   - Ver comentários (query por post_id)
   - Adicionar comentário

---

## TAREFA 002: Sistema de Rankings Automáticos

**Prioridade:** ALTA  
**Estado Atual:** Não implementado  
**Ficheiros Envolvidos:** `convex/games.ts`, `convex/users.ts`, novo ficheiro `convex/rankings.ts`

### Descrição
Implementar rankings automáticos de jogadores baseados nas estatísticas de jogos.

### O Que Fazer

1. **Criar Módulo de Rankings** em `convex/rankings.ts`:
   - Query `getRankingsByGoals()` - ranking de melhores marcadores
   - Query `getRankingsByAssists()` - ranking de melhores assistentes
   - Query `getRankingsByGamesPlayed()` - ranking de jogadores mais activos
   - Query `getRankingsByWinRate()` - ranking de percentagem de vitórias

2. **Criar Página de Rankings** em `app/(tabs)/rankings.tsx`:
   - Tabs para cada tipo de ranking (Golos, Assistências, Jogos, Vitórias)
   - Lista ordenada com posição, avatar, nome, número
   - Destaque para top 3

3. **Lógica de Cálculo**:
   - Aggregar estatísticas dos jogos completados
   - Calcular rankings em tempo real

---

## TAREFA 003: UI para Sistema de Lesões

**Prioridade:** BAIXA  
**Estado Atual:** Tabela `injuries` existe, UI não  
**Ficheiros Envolvidos:** `convex/injuries.ts`, `app/(jogador)/lesoes.tsx` (criar)

### Descrição
Desenvolver interface para jogadores registarem e acompanharem lesões.

### O Que Fazer

1. **Criar Página de Lesões** em `app/(jogador)/lesoes.tsx`:
   - Lista de lesões do jogador (ativas e historial)
   - Cada lesão: tipo, data_início, data_fim, descrição, estado (ativa/recuperado)

2. **Funcionalidades**:
   - Criar registo de lesão (mutation `injuries.create`)
   - Editar lesão
   - Marcar como recuperada
   - Ver histórico de lesões

3. **Backend** (se não existir):
   - Query `injuries.getByUserId` - lesões do utilizador
   - Mutation `injuries.create` - criar lesão
   - Mutation `injuries.update` - atualizar
   - Mutation `injuries.markAsRecovered` - marcar recuperada

---

## TAREFA 004: UI para Sistema de Presenças

**Prioridade:** BAIXA  
**Estado Atual:** Tabela `attendance` existe, UI não  
**Ficheiros Envolvidos:** `convex/attendance.ts`, `app/(treinador)/presencas.tsx` (criar)

### Descrição
Implementar sistema para treinadores marcarem presença em treinos/eventos.

### O Que Fazer

1. **Criar Página de Presenças** em `app/(treinador)/presencas.tsx`:
   - Lista de eventos (treinos/jogos)
   - Por evento, ver lista de atletas esperados
   - Checkboxes para marcar presença/ausência

2. **Funcionalidades**:
   - Ver presenças por evento (query)
   - Marcar presença (mutation)
   - Ver estatísticas de presença por atleta

3. **Backend** (se não existir):
   - Query `attendance.getByEventId` - presenças por evento
   - Query `attendance.getByUserId` - histórico de presenças
   - Mutation `attendance.mark` - marcar presença

---

## TAREFA 005: UI para Planos de Treino

**Prioridade:** MÉDIA  
**Estado Atual:** Tabela `trainingPlans` existe, UI não  
**Ficheiros Envolvidos:** `convex/trainingPlans.ts`, `app/(treinador)/planos.tsx` (criar)

### Descrição
Criar interface para treinadores criarem e gerirem planos de treino estruturados.

### O Que Fazer

1. **Criar Página de Planos** em `app/(treinador)/planos.tsx`:
   - Lista de planos de treino criados
   - Criar novo plano (nome, descrição, exercícios, frequência)
   - Ver/editar plano existente
   - Atribuir plano a atletas

2. **Estrutura de Plano**:
   - Nome do plano
   - Descrição/objetivo
   - Lista de exercícios (nome, séries, reps, carga)
   - Duração estimada
   - Frequência (dias por semana)

3. **Funcionalidades**:
   - CRUD completo de planos
   - Atribuir plano a jogador
   - Jogador ver os seus planos atribuídos

---

## TAREFA 006: UI para Grupos de Chat

**Prioridade:** MÉDIA  
**Estado Atual:** Tabelas `groupConversations`, `groupMembers`, `groupMessages` existem  
**Ficheiros Envolvidos:** `convex/groupConversations.ts`, `app/(tabs)/grupos.tsx` (criar)

### Descrição
Implementar interface para conversas de grupo (ex: grupo da equipa).

### O Que Fazer

1. **Criar Página de Grupos** em `app/(tabs)/grupos.tsx`:
   - Lista de grupos que o utilizador pertence
   - Criar novo grupo (nome, descrição, adicionar membros)
   - Entrar/sair de grupos

2. **Vista de Chat de Grupo**:
   - Mensagens do grupo
   - Lista de membros
   - Enviar mensagem (mutation existente)

3. **Funcionalidades**:
   - Criar grupo (mutation)
   - Adicionar membro a grupo
   - Remover membro
   - Listar grupos do utilizador
   - Mensagens do grupo em tempo real

---

## TAREFA 007: Chat com Envio de Imagens

**Prioridade:** MÉDIA  
**Estado Atual:** Chat texto funciona  
**Ficheiros Envolvidos:** `app/(tabs)/chat.tsx`, `convex/chat.ts`

### Descrição
Adicionar suporte para enviar imagens no chat.

### O Que Fazer

1. **Modificar Schema de Messages** (se necessário):
   - Adicionar campo `image_url` (opcional)

2. **Modificar UI de Chat** em `app/(tabs)/chat.tsx`:
   - Adicionar botão para anexar imagem
   - Usar `expo-image-picker` para selecionar imagem
   - Upload para Convex Storage
   - Mostrar imagem na mensagem (se existir)

3. **Modificar Mutation sendMessage**:
   - Aceitar `image_url` como parâmetro opcional
   - Guardar URL da imagem na mensagem

---

## TAREFA 008: Sistema de Recomendações Automáticas

**Prioridade:** MÉDIA  
**Estado Atual:** Não implementado  
**Ficheiros Envolvidos:** `convex/analytics.ts` (criar), `app/(jogador)/recomendacoes.tsx` (criar)

### Descrição
Implementar recomendações automáticas de treino/melhoria baseadas nos dados do jogador.

### O Que Fazer

1. **Criar Módulo de Analytics** em `convex/analytics.ts`:
   - Query `getRecommendations` - gerar recomendações baseadas em:
     - Frequência de treinos (sugerir mais treinos se baixa)
     - Posição no campo (sugerir exercícios específicos)
     - Estatísticas de jogos (melhorar áreas fracas)
     - Lesões recentes (sugerir recuperação)

2. **Criar Página de Recomendações** em `app/(jogador)/recomendacoes.tsx`:
   - Lista de recomendações personalizadas
   - Cada recomendação: ícone, título, descrição, ação sugerida
   - Categorias: Treino, Recuperação, Nutrição, Tática

3. **Tipos de Recomendação**:
   - "Aumenta frequência de treinos"
   - "Foca em exercícios de resistência"
   - "Considera descansar após lesão"
   - "Melhora velocidade de sprint"

---

## TAREFA 009: Completar Traduções i18n

**Prioridade:** MÉDIA  
**Estado Atual:** ~70% traduzido  
**Ficheiros Envolvidos:** `assets/locales/pt.json`, `assets/locales/en.json`, `assets/locales/es.json`

### Descrição
Completar todas as traduções faltantes nos ficheiros de idioma.

### O Que Fazer

1. **Auditar Textos Hardcoded**:
   - Procurar strings em código que não usam `t()`
   - Exemplo: "Acesso Restrito", "Criar", "Cancelar", etc.

2. **Adicionar Traduções Faltantes** em cada locale:
   - `treinos.*` - completar todas
   - `jogos.*` - completar todas
   - `dashboard.*` - completar todas
   - `chat.*` - completar todas
   - Mensagens de erro e sucesso

3. **Verificar Consistência**:
   - Todas as páginas devem usar `useTranslation`
   - Botões, labels, placeholders devem ser traduzidos

---

## TAREFA 010: Página de Equipa (Treinador)

**Prioridade:** ALTA  
**Estado Atual:** Tab existe mas funcionalidade limitada  
**Ficheiros Envolvidos:** `app/(treinador)/equipa.tsx`, `convex/teams.ts`

### Descrição
Completar página de gestão de equipa para treinadores.

### O Que Fazer

1. **Criar/Ver Equipa**:
   - Ver equipa atribuída ao treinador
   - Criar nova equipa (mutation)
   - Editar detalhes da equipa (nome, logo)

2. **Gerir Atletas**:
   - Lista de atletas na equipa
   - Adicionar atleta à equipa
   - Remover atleta da equipa
   - Ver perfil do atleta

3. **Backend Necessário**:
   - Verificar mutations `teams.create`, `teams.update`
   - Mutations para adicionar/remover membros
   - Query para atletas da equipa

---

## TAREFA 011: Página de Analytics (Treinador)

**Prioridade:** MÉDIA  
**Estado Atual:** CoachDashboard básico  
**Ficheiros Envolvidos:** `components/CoachAnalytics.tsx`, `app/(treinador)/analytics.tsx`

### Descrição
Desenvolver página de analytics detalhada para treinadores.

### O Que Fazer

1. **Estatísticas da Equipa**:
   - Total de jogos, vitórias, empates, derrotas
   - Total de golos marcados/sofridos
   - Média de golos por jogo
   - Desempenho em casa vs fora

2. **Gráficos**:
   - Gráfico de evolução ao longo da época
   - Comparação com época anterior
   - Distribuição de posições dos atletas

3. **Usar Componentes Existentes**:
   - `EvolutionChart.tsx`
   - `StatsComparison.tsx`
   - `TeamComparison.tsx`

---

## TAREFA 012: Página de Olheiro - Pesquisa Avançada UI

**Prioridade:** ALTA  
**Estado Atual:** Funcionalidade parcial  
**Ficheiros Envolvidos:** `app/(olheiro)/pesquisa.tsx`, `convex/scout.ts`

### Descrição
Completar interface de pesquisa avançada de atletas para olheiros.

### O Que Fazer

1. **Filtros de Pesquisa**:
   - Posição (guarda-redes, defesa, médio, avançado)
   - Idade (range slider)
   - Localização (cidade/região)
   - Estatísticas mínimas (golos, jogos)

2. **Resultados**:
   - Lista de atletas que passam nos filtros
   - Cards com info resumida
   - Ordenação por relevância

3. **Ações**:
   - Ver perfil completo do atleta
   - Criar relatório de scouting
   - Adicionar à lista de observados

---

## TAREFA 013: Sistema de Convites

**Prioridade:** BAIXA  
**Estado Atual:** Tabela `invites` existe  
**Ficheiros Envolvidos:** `convex/invites.ts`, `app/notifications.tsx`

### Descrição
Implementar sistema de convites (treinador convida jogador para equipa).

### O Que Fazer

1. **Backend**:
   - Query `invites.getReceived` - convites recebidos
   - Query `invites.getSent` - convites enviados
   - Mutation `invites.create` - criar convite
   - Mutation `invites.accept` - aceitar convite
   - Mutation `invites.reject` - recusar convite

2. **UI para Treinador**:
   - Convites enviados
   - Status (pendente, aceite, recusado)

3. **UI para Jogador**:
   - Convites recebidos (integrar no dashboard/notificações)
   - Aceitar/recusar com um toque

---

## TAREFA 014: Validação de Formulários

**Prioridade:** ALTA  
**Estado Atual:** Validação mínima  
**Ficheiros Envolvidos:** Todos os formulários

### Descrição
Implementar validação robusta em todos os formulários.

### O Que Fazer

1. **Login/Registo** (`app/login.tsx`, `app/register.tsx`):
   - Email válido
   - Password mínimo 8 caracteres
   - Confirmação de password
   - Campos obrigatórios

2. **Treinos** (`app/(tabs)/treinos.tsx`):
   - Nome do treino obrigatório
   - Duração em número válido
   - Tipo selecionado

3. **Jogos** (`app/(tabs)/jogos.tsx`):
   - Adversário obrigatório
   - Data no formato correto
   - Hora no formato correto
   - Local obrigatório

4. **Publicações** (TAREFA 001):
   - Texto ou imagem obrigatório
   - Máximo de caracteres

5. **Implementar Mensagens de Erro**:
   - Mostrar erro abaixo do campo
   - Cor vermelho para campos inválidos

---

## TAREFA 015: Estados de Loading e Erro

**Prioridade:** ALTA  
**Estado Atual:** Inconsistente  
**Ficheiros Envolvidos:** Todos os componentes/pages

### Descrição
Adicionar indicadores de loading e tratamento de erros consistente.

### O Que Fazer

1. **Loading States**:
   - Spinner ou skeleton em todas as queries
   - Desabilitar botões durante mutations
   - Mostrar "A carregar..." com ícones

2. **Error States**:
   - Try/catch em todas as mutations
   - Alert ou toast para erros
   - Mensagens amigáveis ("Erro ao carregar dados", "Erro ao guardar")

3. **Empty States**:
   - Mensagens quando listas vazias
   - Sugestão de ação ("Crie o seu primeiro treino")

---

## TAREFA 016: Otimização de Performance

**Prioridade:** MÉDIA  
**Estado Atual:** Funcional mas pode melhorar  
**Ficheiros Envolvidos:** Componentes de lista

### Descrição
Otimizar performance de listas e carregamento.

### O Que Fazer

1. **FlatList Optimizations**:
   - `windowSize` otimizado
   - `removeClippedSubviews={true}`
   - `maxToRenderPerBatch` configurado
   - `initialNumToRender` ajustado

2. **Lazy Loading**:
   - Carregar mais dados ao fazer scroll
   - Limitar items carregados inicialmente

3. **Imagens**:
   - Usar `resizeMode="cover"` corretamente
   - Placeholder para imagens a carregar

---

## TAREFA 017: Testes Unitários

**Prioridade:** BAIXA  
**Estado Atual:** Não implementado  
**Ficheiros Envolvidos:** `__tests__/` (criar)

### Descrição
Adicionar testes unitários para funcionalidades críticas.

### O Que Fazer

1. **Configurar Ambiente**:
   - Instalar Jest
   - Configurar testing library

2. **Testes de Backend (Convex)**:
   - Testar mutations principais
   - Testar queries com dados mock

3. **Testes de UI**:
   - Testar componentes críticos
   - Testar fluxos de autenticação

---

## RESUMO DAS TAREFAS

| ID | Tarefa | Prioridade | Complexidade |
|----|--------|------------|--------------|
| 001 | Feed/Publicações completo | ALTA | Alta |
| 002 | Rankings automáticos | ALTA | Média |
| 003 | UI Sistema de Lesões | BAIXA | Baixa |
| 004 | UI Sistema de Presenças | BAIXA | Baixa |
| 005 | UI Planos de Treino | MÉDIA | Média |
| 006 | UI Grupos de Chat | MÉDIA | Média |
| 007 | Chat com Imagens | MÉDIA | Baixa |
| 008 | Recomendações Automáticas | MÉDIA | Alta |
| 009 | Completar Traduções | MÉDIA | Baixa |
| 010 | Página Equipa (Treinador) | ALTA | Média |
| 011 | Analytics (Treinador) | MÉDIA | Média |
| 012 | Pesquisa Olheiro UI | ALTA | Média |
| 013 | Sistema de Convites | BAIXA | Média |
| 014 | Validação Formulários | ALTA | Baixa |
| 015 | Loading/Error States | ALTA | Baixa |
| 016 | Otimização Performance | MÉDIA | Baixa |
| 017 | Testes Unitários | BAIXA | Alta |

---

*Documento gerado em: 13/04/2026*
