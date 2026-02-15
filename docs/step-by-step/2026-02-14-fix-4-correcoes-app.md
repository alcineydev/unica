# FIX: 4 Correções App Assinante

**Data:** 2026-02-14  
**Tipo:** Fix — UX + bugs + nova feature

---

## Correções

### 1. Dropdown sininho cortado
- **Problema:** `overflow-hidden` no hero cortava o dropdown
- **Fix:** Dropdown agora usa `fixed` no mobile + `z-[9999]`
- **Arquivo:** `src/components/app/notification-bell.tsx`

### 2. Benefícios com "0% OFF"
- **Problema:** `benefit.value` poderia ser string JSON ou objeto, causando `value.percentage = undefined`
- **Fix:** Parse safety com `typeof` check + `JSON.parse` fallback em 2 locais da API
- **Arquivo:** `src/app/api/app/home/route.ts` (processParceiro + benefits map)

### 3. Mobile menu hamburguer
- **Feature:** Botão ☰ ao lado do sino no hero mobile
- **Drawer:** Painel dark navy desliza da direita
- **Itens:** Meu Perfil, Carteira, Notificações, Sair
- **Comportamento:** Fecha ao navegar, fecha ao clicar fora
- **Arquivo:** `src/components/app/mobile-menu.tsx` (criado)

### 4. Plano Convite sem upgrade
- **Problema:** Convite já tem todos os benefícios, upgrade não faz sentido
- **Fix:** `isConvite` flag → `planosUpgrade = []` + card "✓ Acesso Total"
- **Arquivo:** `src/app/(app)/app/page.tsx`

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/app/notification-bell.tsx` | Fix dropdown position |
| `src/app/api/app/home/route.ts` | Fix benefit value parse |
| `src/components/app/mobile-menu.tsx` | Criado |
| `src/components/app/index.ts` | Export MobileMenu |
| `src/app/(app)/app/page.tsx` | Menu + Convite + overflow fix |

---

## Verificação
- Zero erros de lint
- Hero sem `overflow-hidden` (não corta dropdowns)
- Dropdown notificações com `z-[9999]` e `fixed` no mobile
- Benefit values com parse safety
