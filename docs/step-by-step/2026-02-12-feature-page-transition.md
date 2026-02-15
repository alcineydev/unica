# Feature: Animação de Transição entre Páginas — App Assinante

**Data:** 2026-02-12  
**Redesign:** 2026-02-15

## Problema
Ao navegar entre páginas no app do assinante, aparecia tela branca antes do `loading.tsx` carregar. Spinner v1 sumia cedo demais (pathname muda antes da página renderizar).

## Solução (v2 — Redesign Premium)
Componente `PageTransition` com logo UNICA branded + spinner orbital. Background `#f8fafc` idêntico ao app garante zero tela branca. Loading.tsx com `min-h-screen bg-[#f8fafc]` cobrem toda a viewport.

## Arquivos Criados/Atualizados

| Arquivo | Função |
|---------|--------|
| `src/components/app/page-transition.tsx` | Logo "U" + spinner orbital SVG + dots animados |

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/app/index.ts` | Export do `PageTransition` |
| `src/app/(app)/layout.tsx` | Import + montagem do `<PageTransition />` |
| `src/app/globals.css` | CSS `skeleton-shimmer` + `spinner-orbital` + `bounce-delay-*` |
| 12x `loading.tsx` do app | `min-h-screen bg-[#f8fafc] animate-in fade-in duration-300` |

## Fluxo

1. Usuário clica em link `/app/*`
2. `PageTransition` mostra tela com logo UNICA + spinner orbital (bg `#f8fafc`)
3. Next.js inicia navegação → `loading.tsx` renderiza (mesmo bg `#f8fafc`)
4. Pathname muda → spinner fade-out → skeleton já visível por baixo
5. Dados carregam → página real substitui skeleton

## Como Funciona

- **Click listener global**: Captura cliques em `<a>` com href `/app/*`
- **Logo branded**: Quadrado azul com "U" + anel orbital SVG gradient
- **Background unificado**: `#f8fafc` em spinner E loading.tsx = zero flash branco
- **Safety timeout**: 5s para não travar caso navegação falhe
- **CSS classes**: `spinner-orbital`, `bounce-delay-*` no globals.css (sem inline styles)
