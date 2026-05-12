# NextApp

Aplicacao multiplataforma feita com Expo, React Native, Expo Router e Convex.

## Stack atual

- Frontend: Expo, React Native, Expo Router, TypeScript
- Backend e base de dados: Convex
- Autenticacao: Convex Auth com email e palavra-passe
- Uploads: Convex Storage
- Web hosting: export estatico do Expo servido no subdominio

## Estrutura relevante

- `app/`: rotas e ecras Expo Router
- `hooks/`: estado de autenticacao, tema e hooks partilhados
- `convex/`: schema, funcoes, auth e HTTP routes do Convex
- `utils/apiClient.ts`: reexport da API gerada pelo Convex

## Instalacao local

```bash
npm install
cp .env.example .env.local
```

Define `EXPO_PUBLIC_CONVEX_URL` em `.env.local` com o URL do teu deployment Convex.

## Desenvolvimento

Terminal 1:

```bash
npm run convex:dev
```

Terminal 2:

```bash
npm run start
```

Web:

```bash
npm run web
```

## Producao

```bash
npm ci
npm run convex:deploy
npm run export:web
```

O comando de export cria `dist/`, que pode ser servido por Node, PM2, Nginx ou Caddy atras do subdominio.

## Variaveis de ambiente

```env
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=
JWT_PRIVATE_KEY=
```

- `EXPO_PUBLIC_CONVEX_URL`: URL publico do deployment Convex usado pelo cliente Expo.
- `CONVEX_DEPLOY_KEY`: chave apenas para deploy no servidor/CI. Nao deve ser exposta ao bundle cliente.
- `JWT_PRIVATE_KEY`: chave privada usada pelo Convex Auth para assinar sessoes. Deve ser configurada no ambiente do deployment Convex, nunca no cliente.

## Checks

```bash
npm run lint
npx tsc --noEmit
npx tsc -p convex/tsconfig.json
npm run export:web
```
