# 🎨 Design System - NextApp

**Versão:** 1.0  
**Última Atualização:** Fevereiro 2026

---

## 📋 Índice

- [Paleta de Cores](#-paleta-de-cores)
- [Tipografia](#-tipografia)
- [Gradientes](#-gradientes)
- [Componentes UI](#-componentes-ui)
- [Espaçamento](#-espaçamento)
- [Ícones](#-ícones)
- [Animações](#-animações)

---

## 🎨 Paleta de Cores

### 🌙 Modo Escuro (Dark Mode)

| Token | Código Hex | Uso |
|-------|------------|-----|
| `bg` | `#0f172a` | Fundo principal da aplicação |
| `surface` | `#1e293b` | Cards, modais, superfícies elevadas |
| `text` | `#f1f5f9` | Texto principal |
| `textMuted` | `#94a3b8` | Texto secundário, labels |
| `border` | `#334155` | Bordas de inputs, divisores |
| `primary` | `#60a5fa` | Cor de destaque, botões principais, links |
| `success` | `#34d399` | Estados de sucesso, confirmações |
| `warning` | `#fbbf24` | Alertas, avisos |
| `danger` | `#f87171` | Erros, ações destrutivas |
| `shadow` | `#000000` | Sombras |

### ☀️ Modo Claro (Light Mode)

| Token | Código Hex | Uso |
|-------|------------|-----|
| `bg` | `#f8fafc` | Fundo principal da aplicação |
| `surface` | `#ffffff` | Cards, modais, superfícies elevadas |
| `text` | `#1e293b` | Texto principal |
| `textMuted` | `#64748b` | Texto secundário, labels |
| `border` | `#e2e8f0` | Bordas de inputs, divisores |
| `primary` | `#3b82f6` | Cor de destaque, botões principais, links |
| `success` | `#10b981` | Estados de sucesso, confirmações |
| `warning` | `#f59e0b` | Alertas, avisos |
| `danger` | `#ef4444` | Erros, ações destrutivas |
| `shadow` | `#000000` | Sombras |

### 🎯 Cores de Eventos

| Tipo | Cor | Código |
|------|-----|--------|
| Treino | 🔵 Azul | `#3B82F6` |
| Jogo | 🟢 Verde | `#10B981` |
| Médico | 🔴 Vermelho | `#EF4444` |
| Amarelo | 🟡 Amarelo | `#F59E0B` |
| Roxo | 🟣 Roxo | `#8B5CF6` |
| Rosa | 🩷 Rosa | `#EC4899` |

---

## 🔤 Tipografia

### Tamanhos de Fonte

| Elemento | Tamanho | Peso |
|----------|---------|------|
| **Título Principal (H1)** | 32px | Bold (700) |
| **Título Secção (H2)** | 20px | Bold (700) |
| **Labels/Subtítulos** | 16px | Semi-Bold (600) |
| **Texto Normal** | 16px | Regular (400) |
| **Texto Pequeno** | 14px | Regular (400) |
| **Texto Muito Pequeno** | 12px | Regular (400) |
| **Botões** | 18px | Semi-Bold (600) |

### Font Family

A aplicação utiliza as fontes padrão do sistema:
- **iOS:** San Francisco
- **Android:** Roboto

---

## 🌈 Gradientes

### Modo Escuro

| Nome | Cores | Uso |
|------|-------|-----|
| `background` | `#0f172a` → `#1e293b` | Fundo das páginas |
| `surface` | `#1e293b` → `#334155` | Cards elevados |
| `primary` | `#3b82f6` → `#1d4ed8` | Botões principais |
| `success` | `#10b981` → `#059669` | Estados de sucesso |
| `warning` | `#f59e0b` → `#d97706` | Avisos |
| `danger` | `#ef4444` → `#dc2626` | Erros/Alertas |
| `muted` | `#374151` → `#4b5563` | Elementos desativados |

### Modo Claro

| Nome | Cores | Uso |
|------|-------|-----|
| `background` | `#f8fafc` → `#e2e8f0` | Fundo das páginas |
| `surface` | `#ffffff` → `#f8fafc` | Cards elevados |
| `primary` | `#3b82f6` → `#1d4ed8` | Botões principais |
| `success` | `#10b981` → `#059669` | Estados de sucesso |
| `warning` | `#f59e0b` → `#d97706` | Avisos |
| `danger` | `#ef4444` → `#dc2626` | Erros/Alertas |
| `muted` | `#9ca3af` → `#6b7280` | Elementos desativados |

---

## 🧩 Componentes UI

### Botões

#### Botão Primário
```
- Background: colors.primary
- Texto: #ffffff
- Border Radius: 12px
- Padding: 16px vertical
- Font: 18px, Semi-Bold (600)
```

#### Botão Secundário
```
- Background: colors.surface
- Texto: colors.text
- Border Radius: 8px
- Padding: 12px
```

#### Botão Destrutivo
```
- Background: #EF4444
- Texto: #ffffff
- Border Radius: 8px
- Padding: 12px
```

### Inputs

```
- Background: rgba(255,255,255,0.05) ou colors.surface
- Border: 1px solid colors.border
- Border Radius: 12px
- Padding: 12-16px horizontal, 12px vertical
- Ícone: Lado esquerdo com margin-right de 12px
- Placeholder: colors.textMuted
```

### Cards/Sections

```
- Background: colors.surface
- Border: 1px solid colors.border
- Border Radius: 12px
- Padding: 16px
- Margin Bottom: 16px
```

### Modais

```
- Background Overlay: rgba(0,0,0,0.5)
- Modal Background: colors.bg
- Border Radius: 12px
- Max Height: 80%
- Padding: 20px
- Margin: 20px
```

### Tab Bar

```
- Background: colors.surface
- Active Color: colors.primary
- Inactive Color: colors.textMuted
- Border Top: 2px solid colors.border
- Height: 80px
- Padding Top: 10px
- Label: 12px, Semi-Bold (600)
```

### Avatar/Imagem de Perfil

```
Tamanho Grande:
- Width/Height: 100px
- Border Radius: 50px (circular)

Tamanho Pequeno:
- Width/Height: 50px
- Border Radius: 25px (circular)
```

### Floating Action Button (FAB)

```
- Background: #007bff
- Width/Height: 50px
- Border Radius: 25px (circular)
- Shadow: elevation 5
- Posição: Absoluto, top 50px, right 16px
```

### Toggle/Switch

```
- Width: 50px
- Height: 24px
- Border Radius: 12px
- Thumb: 20px circular branco
- Active State: colors.primary
- Inactive State: colors.surface
```

---

## 📏 Espaçamento

### Padding Base

| Contexto | Valor |
|----------|-------|
| Container/Página | 16-20px |
| Cards | 16px |
| Modais | 20px |
| Entre secções | 24px |
| Entre elementos | 8-16px |

### Margins

| Contexto | Valor |
|----------|-------|
| Entre cards | 16px |
| Entre elementos de formulário | 16px |
| Título de secção para conteúdo | 12px |
| Header para conteúdo | 40px |

### Border Radius

| Elemento | Valor |
|----------|-------|
| Botões | 12px |
| Inputs | 8-12px |
| Cards/Sections | 12px |
| Modais | 12px |
| Avatares | 50% (circular) |
| Tags/Badges | 8px |
| Elementos pequenos (dots) | 2-3px |

---

## 🔣 Ícones

A aplicação utiliza **Ionicons** do pacote `@expo/vector-icons`.

### Ícones de Navegação (Tab Bar)

| Tab | Ícone | Nome Ionicons |
|-----|-------|---------------|
| Dashboard | 📊 | `stats-chart` |
| Treinos | 🏋️ | `barbell` |
| Jogos | ⚽ | `football` |
| Equipa | 👥 | `people` |
| Planeamento | 📅 | `calendar` |
| Análise | 📈 | `bar-chart` |
| Feed | 📰 | `newspaper` |
| Mensagens | 💬 | `chatbubbles` |
| Perfil | 👤 | `person` |

### Ícones de Ação

| Ação | Ícone | Nome Ionicons |
|------|-------|---------------|
| Definições | ⚙️ | `settings` |
| Fechar | ✕ | `close` |
| Email | ✉️ | `mail` |
| Password | 🔒 | `lock-closed` |
| Tema Claro | ☀️ | `sunny` |
| Tema Escuro | 🌙 | `moon` |
| Público | 🌍 | `globe` |
| Privado | 🔒 | `lock-closed` |
| Dropdown | ⌄ | `chevron-down` |

### Tamanhos de Ícones

| Contexto | Tamanho |
|----------|---------|
| Tab Bar | size prop (padrão ~24px) |
| Botões/Inputs | 20px |
| Headers/Modais | 24px |

---

## ✨ Animações

### LinearGradient

Utilizado em fundos de páginas para criar profundidade visual.
```javascript
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient 
  colors={colors.gradients.background} 
  style={{ flex: 1 }} 
/>
```

### Transições de Modal

```
- Animation Type: "slide"
- Direção: De baixo para cima
```

### Estados Interativos

- **TouchableOpacity**: Feedback visual padrão em toques
- **Toggles**: Translação horizontal (transform translateX)
- **Heatmap**: Cores de intensidade baseadas em atividade

---

## 📐 Layout Padrões

### Safe Area

Utiliza `react-native-safe-area-context` para garantir conteúdo visível em todos os dispositivos.

### Scroll Views

```javascript
<ScrollView 
  contentContainerStyle={{ paddingBottom: 20 }}
  keyboardShouldPersistTaps="handled"
/>
```

### Keyboard Avoiding View

```javascript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
/>
```

---

## 🌍 Internacionalização

A aplicação suporta múltiplos idiomas:
- 🇵🇹 Português (pt)
- 🇬🇧 Inglês (en)
- 🇪🇸 Espanhol (es)

Utiliza **i18next** e **react-i18next** para traduções.

---

## 🔧 Implementação do Tema

O tema é gerido através do hook `useTheme`:

```typescript
const { colors, isDarkMode, toggleDarkMode } = useTheme();
```

O estado do tema é persistido via **AsyncStorage**.

---

*Este documento serve como referência para manter consistência visual em toda a aplicação.*
