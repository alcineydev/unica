# Refatoração App Assinante - Fase 1: Fixes Críticos + Identidade Visual

**Data:** 2026-02-14  
**Tipo:** Refatoração / Fix / UI

---

## Contexto

O app do assinante (`/app`) apresentava vários problemas identificados no diagnóstico:
1. Dark mode toggle ativo (projeto é light-only)
2. Popup de notificação duplicado (permission + in-app sobrepõem)
3. Sidebar e BottomNav com itens diferentes
4. Planos no app ainda tinham "Ativar Grátis"
5. Fundo inconsistente (slate-50 vs background)
6. Visual genérico sem identidade de marca

---

## Arquivos Alterados

### 1. `src/components/app/app-header.tsx` — REESCRITO
- **Removido:** ThemeToggle (import e componente)
- **Novo design:** Logo UNICA azul (gradient from-blue-600 to-blue-700), badge de notificação, avatar dropdown com informações do usuário
- **Mantido:** Polling de notificações (30s), NotificationModal in-app para novas notificações
- **Cores:** Identidade azul (#2563EB), sem referências dark mode

### 2. `src/components/app/bottom-nav.tsx` — REESCRITO
- **5 itens consistentes:** Início, Buscar, Carteira, Parceiros, Perfil
- **Ícones:** Home, Search, CreditCard, Store, User (lucide-react)
- **Active state:** text-blue-600 com stroke mais grosso
- **Sem dark mode classes**

### 3. `src/components/app/app-sidebar.tsx` — REESCRITO
- **7 itens + Sair:** Mesma base do BottomNav + Avaliações, Notificações
- **Active state:** bg-blue-50 text-blue-600 font-semibold
- **Logout:** Botão ghost com hover vermelho
- **Sticky:** top-16 com h-[calc(100vh-64px)]

### 4. `src/components/app/notification-permission-modal.tsx` — AJUSTADO
- **Delay:** 2000ms → 5000ms (evita conflito com notification modal)
- **Verificação:** Antes de abrir, checa se já existe um `[data-state="open"][role="dialog"]`
- **Removidas:** Classes `dark:` de todos os elementos (dark:bg-green-950, dark:text-green-200, etc.)

### 5. `src/app/(app)/layout.tsx` — AJUSTADO
- **Fundo:** `bg-slate-50` → `bg-[#f8fafc]` (mesmo tom, mas explícito)
- **Estrutura:** Sidebar + main com padding inferior diferenciado (pb-20 mobile, pb-6 desktop)
- **Toaster:** Movido para position="top-right"
- **Mantido:** Verificação de role (ASSINANTE, DEVELOPER, ADMIN) e redirect

### 6. `src/app/(app)/app/planos/page.tsx` — AJUSTADO
- **Filtro:** Planos gratuitos (price <= 0) removidos da listagem
- **Removido:** Botão "Ativar Grátis" e lógica de ativação de plano grátis
- **Removido:** Display "Grátis" no preço
- **Removido:** Classes dark mode
- **Removido:** Sticky header e backgrounds genéricos (min-h-screen, bg-gradient, backdrop-blur)
- **Mantido:** Redirect para checkout público via slug

### 7. `src/components/app/index.ts` — VERIFICADO
- Exports já estavam corretos: `{ BottomNav }`, `{ AppHeader }`, `{ AppSidebar }`

---

## Validação
- TypeScript: `tsc --noEmit` → 0 erros
- Lint: 0 erros nos arquivos alterados
- Build: Erro pré-existente de Resend API key (não relacionado)

---

## Observações
- Todos os componentes usam **named exports** (não default) para consistência com o index.ts
- O header mantém a lógica completa de NotificationModal in-app (polling + popup quando count aumenta)
- A navegação agora é **consistente** entre mobile e desktop
- O background `#f8fafc` é o mesmo tom de `slate-50` mas explícito para evitar variações de tema
