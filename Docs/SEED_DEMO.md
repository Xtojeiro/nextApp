# Seed Demo

## Stack de dados

- Backend/API: Express em [server/index.js](/C:/Users/tomas/Desktop/Escola/PAP/nextApp/server/index.js)
- Base de dados: MongoDB nativo
- Seed principal: [scripts/seed-demo.ts](/C:/Users/tomas/Desktop/Escola/PAP/nextApp/scripts/seed-demo.ts)
- Não existe ORM ativo neste projeto. O acesso à base de dados é feito diretamente com `mongodb`.

## O que o seed cria

- Utilizadores com perfis realistas: treinadores, jogadores, olheiros, contas ativas e inativas
- Conta demo principal `admin@test.com` para testes
- Equipas, relações coach -> team e player -> team
- Treinos, histórico de treinos e planos de treino
- Eventos de calendário
- Jogos agendados e concluídos
- Estatísticas de jogo e rankings
- Descoberta de utilizadores, follows e mensagens
- Conversas privadas com mensagens realistas
- Grupos de conversa com membros e mensagens
- Seguidores, bloqueios, notificações
- Relatórios de olheiros
- Convites
- Lesões
- Conquistas
- Época, liga e classificação

## Utilizadores de teste

- `admin@test.com` / `password123`
  Nota: o sistema atual não tem role `ADMIN`. Esta conta demo usa a role `COACH` e está marcada com `tags: ["ADMIN", "DEMO"]`.
- `coach@test.com` / `password123`
- `player@test.com` / `password123`
- `scout@test.com` / `password123`

## Como correr

1. Garantir que `.env.local` ou `.env` tem `MONGODB_URI`
2. Popular ou atualizar apenas os dados demo:

```bash
npm run seed:demo
```

3. Remover apenas os dados demo criados pelo seed:

```bash
npm run seed:demo:reset
```

4. Limpar todas as coleções da app e recriar do zero com a demo:

```bash
npm run seed:demo:fresh
```

## Reset/Limpeza

- `seed:demo:reset`: apaga apenas documentos com prefixo `seed:`
- `seed:demo:fresh`: apaga todas as coleções da aplicação e volta a inserir a demo

Usa `seed:demo:fresh` apenas quando quiseres uma base totalmente limpa para demonstração.
