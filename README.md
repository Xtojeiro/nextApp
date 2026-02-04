# 🏀 NextApp - Plataforma de Gestão Desportiva

Uma aplicação mobile multiplataforma desenvolvida com **Expo** (React Native) e **Convex** como backend, focada na gestão de equipas desportivas para jogadores, treinadores e olheiros.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)
![Expo SDK](https://img.shields.io/badge/Expo-SDK%2054-black)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estado do Desenvolvimento](#-estado-do-desenvolvimento)

---

## 🎯 Visão Geral

NextApp é uma plataforma completa para gestão desportiva que conecta **jogadores**, **treinadores** e **olheiros**. A aplicação oferece ferramentas para:

- Gestão de treinos e exercícios
- Acompanhamento de jogos e estatísticas
- Comunicação entre utilizadores (chat)
- Planeamento de eventos e calendário
- Análise de desempenho
- Gestão de equipas

---

## ⚡ Funcionalidades

### 👤 Para Jogadores/Atletas
- Dashboard personalizado com estatísticas
- Registo e acompanhamento de treinos
- Calendário de jogos e eventos
- Chat com treinadores e equipas
- Perfil público/privado

### 🏋️ Para Treinadores
- Gestão de equipas e atletas
- Criação de planos de treino
- Agendamento de jogos e eventos
- Notas sobre atletas
- Dashboard de estatísticas da equipa

### 🔍 Para Olheiros
- Pesquisa de jogadores
- Visualização de perfis e estatísticas
- Sistema de seguir jogadores

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Expo** | ~54.0 | Framework React Native |
| **React** | 19.1.0 | Biblioteca UI |
| **React Native** | 0.81.5 | Mobile development |
| **TypeScript** | ~5.9.2 | Tipagem estática |
| **Expo Router** | ~6.0 | File-based routing |

### Backend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Convex** | ^1.31.6 | Backend-as-a-Service |

### Bibliotecas Principais
- `expo-image-picker` - Seleção de imagens
- `expo-haptics` - Feedback tátil
- `react-native-reanimated` - Animações
- `react-native-gesture-handler` - Gestos
- `i18next` / `react-i18next` - Internacionalização
- `bcryptjs` - Hash de passwords

---

## 📁 Estrutura do Projeto

```
nextApp/
├── app/                          # Páginas da aplicação (file-based routing)
│   ├── (tabs)/                   # Tabs principais
│   │   ├── _layout.tsx           # Layout das tabs
│   │   ├── index.tsx             # Feed/Home
│   │   ├── dashboard.tsx         # Dashboard principal
│   │   ├── treinos.tsx           # Gestão de treinos
│   │   ├── jogos.tsx             # Calendário de jogos
│   │   ├── planeamento.tsx       # Planeamento de eventos
│   │   ├── chat.tsx              # Sistema de mensagens
│   │   ├── equipa.tsx            # Gestão de equipa
│   │   ├── analise.tsx           # Análise de desempenho
│   │   └── profile.tsx           # Perfil do utilizador
│   ├── _layout.tsx               # Layout principal
│   ├── login.tsx                 # Página de login
│   └── register.tsx              # Registo de utilizador
├── components/                   # Componentes reutilizáveis
│   ├── CoachDashboard.tsx        # Dashboard para treinadores
│   ├── Header.tsx                # Cabeçalho
│   └── LoadingSpinner.tsx        # Indicador de carregamento
├── convex/                       # Backend Convex
│   ├── schema.ts                 # Esquema da base de dados
│   ├── users.ts                  # Funções de utilizadores
│   ├── workouts.ts               # Funções de treinos
│   ├── chat.ts                   # Funções de chat
│   ├── games.ts                  # Funções de jogos
│   └── auth.config.ts            # Configuração de autenticação
├── hooks/                        # Custom React hooks
├── utils/                        # Funções utilitárias
├── assets/                       # Imagens e recursos estáticos
├── docs/                         # Documentação do projeto
│   ├── project_analysis.md       # Análise detalhada
│   └── tasks.md                  # Lista de tarefas
├── app.json                      # Configuração Expo
├── package.json                  # Dependências
└── tsconfig.json                 # Configuração TypeScript
```

---

## 🚀 Instalação

### Pré-requisitos
- Node.js (versão LTS recomendada)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Convex](https://convex.dev)

### Passos

1. **Clonar o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd nextApp
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**
   
   Criar ficheiro `.env.local` na raiz:
   ```env
   CONVEX_DEPLOYMENT=<seu-deployment>
   EXPO_PUBLIC_CONVEX_URL=<url-do-convex>
   ```

4. **Iniciar o servidor Convex**
   ```bash
   npx convex dev
   ```

5. **Iniciar a aplicação**
   ```bash
   npx expo
   ```

---

## ⚙️ Configuração

### Convex Backend
O backend utiliza Convex com as seguintes tabelas:

| Tabela | Descrição |
|--------|-----------|
| `users` | Utilizadores (jogadores, treinadores, olheiros) |
| `players` | Dados estendidos de jogadores |
| `coaches` | Dados estendidos de treinadores |
| `teams` | Equipas |
| `workouts` | Treinos |
| `games` | Jogos |
| `events` | Eventos de calendário |
| `trainingPlans` | Planos de treino |
| `conversations` | Conversas de chat |
| `messages` | Mensagens |
| `follows` | Sistema de seguir |
| `posts` | Publicações |

---

## 📜 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Iniciar | `npm start` | Inicia o servidor de desenvolvimento Expo |
| Android | `npm run android` | Executa no emulador/dispositivo Android |
| iOS | `npm run ios` | Executa no simulador/dispositivo iOS |
| Web | `npm run web` | Executa no browser |
| Lint | `npm run lint` | Verifica erros de código |
| Reset | `npm run reset-project` | Limpa o projeto para novo início |

---

## 📊 Estado do Desenvolvimento

| Área | Estado | Notas |
|------|--------|-------|
| **Frontend (UI)** | ✅ 90% | Páginas principais implementadas |
| **Backend Convex** | 🟡 Em progresso | Schema e funções base criadas |
| **Autenticação** | 🟡 Parcial | Login/Registo funcional |
| **Chat** | 🟡 Parcial | UI pronta, backend em desenvolvimento |
| **Sistema de Equipas** | 🟡 Parcial | UI pronta, backend em desenvolvimento |
| **Funcionalidades Olheiro** | 🔴 Pendente | Por implementar |


---

## 🔧 Desenvolvimento

### Requisitos de Desenvolvimento
- Editor: VS Code recomendado
- Extensões: ESLint, TypeScript, Expo Tools

### Executar testes
```bash
npm run lint
```

---

## 📱 Plataformas Suportadas

- ✅ iOS (iPhone e iPad)
- ✅ Android
- ✅ Web

---

## 📄 Licença

Projeto privado - Todos os direitos reservados.

---

## 👥 Autor

**Tomás** - Projeto de Aptidão Profissional (PAP)

---

*Última atualização: Fevereiro 2026*
