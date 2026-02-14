# FASE 5B: Desktop Premium — Header Eliminado + Layout Full

**Data:** 2026-02-14

## Problemas Resolvidos

1. Header branco sobrepunha sidebar dark = conflito visual
2. Sidebar começava abaixo do header = gap estranho
3. Gaps laterais entre sidebar/hero e bordas
4. Header duplicava info da sidebar (logo, avatar, notificações)

## Solução Arquitetural

- **Desktop:** ZERO header. Sidebar é navegação principal (logo, user, nav, notif badge, logout)
- **Mobile:** Header slim (bell + avatar) — SÓ mobile (`lg:hidden`)
- **Sidebar:** `h-screen sticky top-0` sem dependência de header
- **Conteúdo:** Sem `mx-auto` restritivo, `max-w-5xl` alinhado à esquerda

## Arquivos Alterados

### 1. `src/components/app/app-header.tsx`
- **Função:** Header global — agora mobile-only
- `hidden lg:block` → `lg:hidden` (mostra mobile, esconde desktop)
- `h-16` → `h-14` (mais slim no mobile)
- Removido `max-w-screen-2xl mx-auto` e `sm:px-6` (desnecessário no mobile)

### 2. `src/app/(app)/layout.tsx` — REESCRITO
- **Função:** Layout principal do app assinante
- `max-w-6xl mx-auto` → `max-w-5xl` SEM `mx-auto`
- Desktop: `lg:px-8 lg:py-6` (padding generoso)
- Mobile: `px-4 py-4` + `pb-20` para bottom nav
- `min-w-0` no main (evita overflow flex)
- `flex min-h-screen` no container
- `lg:pb-0` (desktop sem padding bottom extra)

### 3. `src/components/app/app-sidebar.tsx` — AJUSTADO
- **Função:** Sidebar de navegação desktop com badge de notificações
- Adicionado `useState` + `useEffect` para `notifCount`
- Poll a cada 30s via `/api/app/notifications/count`
- Badge vermelho no item "Notificações" (count > 0, max 99+)
- Indicador ativo (barra azul) não aparece junto do badge

### 4. `src/app/(app)/app/page.tsx` — AJUSTADO
- **Função:** Home principal do assinante
- `-mx-4 sm:-mx-6 -mt-6` → `-mx-4 -mt-4 lg:-mx-8 lg:-mt-6` (hero stretcha full no desktop)
- `pt-5` → `pt-4 lg:pt-5` (ajuste mobile safe area)
- Aplicado tanto no hero quanto no loading skeleton

## Verificações
- `lg:hidden` no header → ✅ line 106
- `mx-auto` no layout → ✅ 0 resultados
- `notifCount` na sidebar → ✅ 3 ocorrências
- `-mx-8` na home → ✅ 2 ocorrências (hero + loading)
- `max-w-screen` no header → ✅ 0 resultados
- Lint: 0 erros introduzidos (1 pré-existente no header)
