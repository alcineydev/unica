# Performance: Loading States Admin

**Data:** 2026-02-14  
**Tipo:** Performance — UX de carregamento

---

## Problema
Navegar entre páginas do admin causava "travamento" de 2-3s — tela congelava enquanto o Next.js App Router esperava a página inteira carregar antes de renderizar.

## Solução
Adicionados `loading.tsx` nos diretórios admin. O Next.js mostra o skeleton **instantaneamente** enquanto a página real carrega em background (Streaming SSR / Suspense boundary automático).

---

## Arquivos Criados (7)

| Arquivo | Layout |
|---------|--------|
| `admin/loading.tsx` | Header + 4 stats + tabela (fallback genérico) |
| `admin/assinantes/loading.tsx` | Header + 5 stats + search + tabela |
| `admin/assinantes/[id]/loading.tsx` | Avatar + cards + sidebar lateral |
| `admin/parceiros/loading.tsx` | Header + 4 stats + search + tabela |
| `admin/planos/loading.tsx` | Header + 3 cards grandes |
| `admin/configuracoes/loading.tsx` | Título + 4 forms |
| `admin/automacoes/loading.tsx` | Header + 3 cards |

---

## Como Funciona
1. Usuário clica em link do menu
2. Next.js detecta `loading.tsx` no diretório de destino
3. Skeleton renderiza **imediatamente** (sem esperar dados)
4. Página real carrega em background (fetch APIs)
5. Quando pronta, substitui o skeleton suavemente

---

## Verificação
- Zero erros de lint
- Todos usam `Skeleton` do shadcn/ui (componente já existente)
- Server Components puros (sem 'use client')
