# Feature: Animação de Transição entre Páginas — App Assinante

**Data:** 2026-02-12  
**Redesign v2:** 2026-02-15  
**Redesign v3:** 2026-02-15

## Problema
Ao navegar entre páginas no app do assinante, aparecia tela branca. v1 sumia cedo demais, v2 não tinha timing mínimo.

## Solução (v3 — Timing UX Premium)
Componente `PageTransition` com logo UNICA + spinner circular fino + barra de progresso fake. Mínimo 1s de exibição (ver a marca), fade-out suave 200ms, safety timeout 6s.

## Arquivos Criados/Atualizados

| Arquivo | Função |
|---------|--------|
| `src/components/app/page-transition.tsx` | Logo "U" + spinner circular + progress bar + timing 1s mín |

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/app/index.ts` | Export do `PageTransition` |
| `src/app/(app)/layout.tsx` | Import + montagem do `<PageTransition />` |
| `src/app/globals.css` | CSS `unica-spinner` + `unica-progress` + `skeleton-shimmer` |
| 12x `loading.tsx` do app | `min-h-screen bg-[#f8fafc] animate-in fade-in duration-300` |

## Fluxo

1. Usuário clica em link `/app/*`
2. `PageTransition` mostra tela com logo UNICA + spinner orbital (bg `#f8fafc`)
3. Next.js inicia navegação → `loading.tsx` renderiza (mesmo bg `#f8fafc`)
4. Pathname muda → spinner fade-out → skeleton já visível por baixo
5. Dados carregam → página real substitui skeleton

## Timing UX

| Cenário | Comportamento |
|---------|---------------|
| Página carrega em 200ms | Spinner fica 1s total, depois fade-out 200ms |
| Página carrega em 1.5s | Spinner some imediatamente com fade-out |
| Página trava | Safety: some após 6s |

## Como Funciona

- **Click listener global**: Captura cliques em `<a>` com href `/app/*`
- **Logo branded**: Quadrado azul gradient com "U" + spinner circular fino
- **Progress bar fake**: Barra que vai até 95% em 2s (sensação de progresso)
- **MIN_DISPLAY_MS = 1000**: Garante 1s mín para ver a marca
- **Fade-out 200ms**: `transition-opacity` + estado `isFadingOut`
- **Background unificado**: `#f8fafc` em spinner E loading.tsx = zero flash branco
- **Safety timeout**: 6s para não travar caso navegação falhe
