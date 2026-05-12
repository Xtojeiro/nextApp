# Prompt para configurar a NextApp no servidor Proxmox

Objetivo: alojar a app Expo Web como subdominio, com Convex como backend/base de dados/autenticacao. O servidor Node no Proxmox deve servir apenas o build estatico `dist/`.

## Tarefas para executar

1. Preparar ambiente:
   - Instalar Node.js LTS e npm.
   - Instalar PM2 globalmente: `npm install -g pm2`.
   - Garantir que o dominio/subdominio aponta para o IP publico do servidor.

2. Obter codigo:
   - Clonar o repositorio da app.
   - Entrar na pasta do projeto.
   - Executar `npm ci`.

3. Configurar ambiente:
   - Criar `.env.production`.
   - Definir:

```env
EXPO_PUBLIC_CONVEX_URL=https://COLOCAR_AQUI_O_DEPLOYMENT.convex.cloud
CONVEX_DEPLOY_KEY=COLOCAR_AQUI_A_CHAVE_DE_DEPLOY_DO_CONVEX
JWT_PRIVATE_KEY=COLOCAR_AQUI_CHAVE_PRIVADA_PKCS8
```

   - Confirmar que `CONVEX_DEPLOY_KEY` e `JWT_PRIVATE_KEY` nunca ficam expostos em ficheiros servidos publicamente.
   - Gerar `JWT_PRIVATE_KEY` em formato PKCS8, numa unica linha, por exemplo:

```bash
node -e "const {generateKeyPairSync}=require('crypto');const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});console.log(privateKey.trimEnd().replace(/\n/g,' '))"
```

   - Definir a chave no Convex: `npx convex env set JWT_PRIVATE_KEY 'VALOR_GERADO'`.

4. Deploy Convex e build web:
   - Executar `npx convex deploy`.
   - Executar `npx expo export --platform web`.
   - Confirmar que a pasta `dist/` foi criada.

5. Servir frontend com Node/PM2:
   - Instalar servidor estatico: `npm install -g serve`.
   - Arrancar app: `pm2 start "serve -s dist -l 3000" --name nextapp-web`.
   - Guardar estado: `pm2 save`.
   - Configurar arranque automatico com `pm2 startup` e seguir a instrucao impressa.

6. Reverse proxy:
   - Configurar Nginx ou Caddy para encaminhar o subdominio para `http://127.0.0.1:3000`.
   - Garantir fallback para SPA/Expo Router: qualquer rota deve devolver `index.html`.
   - Ativar HTTPS com Let's Encrypt.

7. Validacao obrigatoria:
   - Abrir `https://SUBDOMINIO/`.
   - Testar refresh direto em:
     - `/login`
     - `/dashboard`
     - `/chat`
     - `/profile`
   - Criar conta de jogador, treinador e olheiro.
   - Testar login/logout.
   - Testar dashboard, treinos, jogos, equipa, planeamento, chat, perfil, rankings e upload de avatar.
   - Confirmar no painel Convex que as tabelas recebem dados e que nao ha erros nas functions logs.

## Config Nginx de exemplo

```nginx
server {
    server_name app.exemplo.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Depois correr Certbot para HTTPS:

```bash
sudo certbot --nginx -d app.exemplo.com
```
