# Feature: Animação de Transição entre Páginas — App Assinante

**Data:** 2026-02-12

## Problema
Ao navegar entre páginas no app do assinante, aparecia tela branca antes do `loading.tsx` carregar, gerando sensação de travamento.

## Solução
Componente `PageTransition` que intercepta cliques em links `/app/*`, mostra overlay com spinner premium durante a transição, e esconde automaticamente quando o pathname muda. Combinado com `animate-in fade-in` nos loading.tsx para entrada suave dos skeletons.

## Arquivos Criados

| Arquivo | Função |
|---------|--------|
| `src/components/app/page-transition.tsx` | Componente client que detecta navegação via click listener e pathname change, exibe overlay + spinner |

## Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/app/index.ts` | Export do `PageTransition` |
| `src/app/(app)/layout.tsx` | Import + montagem do `<PageTransition />` antes do `<BottomNav />` |
| `src/app/globals.css` | CSS `skeleton-shimmer` keyframes adicionado |
| `src/app/(app)/app/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/parceiros/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/parceiros/[id]/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/carteira/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/notificacoes/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/perfil/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/planos/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/buscar/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/categorias/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/categoria/[slug]/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/minhas-avaliacoes/loading.tsx` | Adicionado `animate-in fade-in duration-300` |
| `src/app/(app)/app/avaliar/[parceiroId]/loading.tsx` | Adicionado `animate-in fade-in duration-300` |

## Fluxo

1. Usuário clica em link `/app/*`
2. `PageTransition` detecta clique → mostra overlay sutil + spinner azul
3. Next.js inicia navegação → `loading.tsx` renderiza com fade-in suave
4. Pathname muda → `PageTransition` some após 150ms
5. Página real aparece

## Como Funciona o PageTransition

- **Click listener global**: Captura cliques em `<a>` com href `/app/*`
- **Overlay**: Fundo `bg-[#f8fafc]/80` com `backdrop-blur-[2px]`, não bloqueia eventos (`pointer-events-none`)
- **Spinner**: 3 camadas — anel externo estático, anel rotativo azul, ponto central pulsante
- **Cleanup**: `useRef` para timeout + cleanup no unmount
