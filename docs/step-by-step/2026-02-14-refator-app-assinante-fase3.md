# Refatoração App Assinante - Fase 3: Padronização de Cores

**Data:** 2026-02-14
**Escopo:** ~100 substituições de cores genéricas em 14 arquivos

## Objetivo
Substituir todas as cores genéricas do tema (text-muted-foreground, bg-primary, etc.) por cores explícitas Tailwind, remover todas as classes `dark:` restantes e garantir identidade visual consistente.

## Regra Global de Substituição

| De | Para |
|----|------|
| `text-muted-foreground` | `text-gray-400` ou `text-gray-500` |
| `text-primary` | `text-blue-600` |
| `bg-primary` | `bg-blue-600` |
| `bg-primary/5`, `bg-primary/10` | `bg-blue-50` |
| `bg-primary/20`, `bg-primary/30` | `bg-blue-100` |
| `from-primary` | `from-blue-600` |
| `to-primary` | `to-blue-700` |
| `border-primary/20` | `border-blue-200` |
| `text-primary-foreground` | `text-white` |
| `bg-muted` | `bg-gray-100` |
| `bg-muted/50` | `bg-gray-50` |
| `bg-background` | `bg-white` ou `bg-[#f8fafc]` |
| `dark:*` | REMOVIDO |

## Arquivos Alterados

### 1. `src/app/(app)/app/perfil/page.tsx`
- Header gradient: `from-primary/90 to-primary` → `from-blue-600 to-blue-700`
- Removidas 4 classes `dark:` no link "Escolher um Plano"
- 27 substituições totais (bg-background, text-muted-foreground, text-primary, etc.)

### 2. `src/app/(app)/app/notificacoes/page.tsx`
- Removida classe `dark:hover:bg-zinc-900`
- Card não-lida: `border-primary/30 bg-primary/5` → `border-blue-200 bg-blue-50/50`
- 6 substituições

### 3. `src/app/(app)/app/parceiros/page.tsx`
- Background: `bg-background` → `bg-[#f8fafc]`
- Grid responsivo: `grid-cols-3` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- 9 substituições

### 4. `src/app/(app)/app/parceiros/[id]/page.tsx`
- Gradients do banner: todas as referências primary/background → blue/gray explícitos
- Logo fallback, benefit badges, WhatsApp fixo
- ~20 substituições

### 5. `src/app/(app)/app/buscar/page.tsx`
- Tags populares: `hover:bg-primary hover:text-primary-foreground` → `hover:bg-blue-600 hover:text-white`
- Categoria ícone: `bg-primary/10 text-primary` → `bg-blue-50 text-blue-600`
- 14 substituições

### 6. `src/app/(app)/app/categorias/page.tsx`
- Fallback gradient: `from-primary to-primary/60` → `from-blue-600 to-blue-400`
- 6 substituições

### 7. `src/app/(app)/app/categoria/[slug]/page.tsx`
- Fallback gradient: `from-primary to-primary/60` → `from-blue-600 to-blue-400`
- `bg-muted` → `bg-gray-100`
- 8 substituições

### 8. `src/app/(app)/app/minhas-avaliacoes/page.tsx`
- Avatar fallback: `bg-primary/10 text-primary` → `bg-blue-50 text-blue-600`
- Estrelas: `fill-zinc-200 text-zinc-200` → `fill-gray-200 text-gray-200`
- 7 substituições

### 9. `src/app/(app)/app/avaliar/[parceiroId]/page.tsx`
- Avatar fallback e dica: azul explícito
- Adicionado `title` no botão de estrelas (acessibilidade)
- 12 substituições

### 10. `src/components/app/parceiros/search-input.tsx`
- `text-muted-foreground` → `text-gray-400`
- `bg-muted` → `bg-gray-100`

### 11. `src/components/app/parceiros/category-filter.tsx`
- `bg-primary text-primary-foreground` → `bg-blue-600 text-white`
- `bg-muted text-muted-foreground` → `bg-gray-100 text-gray-500`
- Removido inline style (lint fix)

### 12. `src/app/(app)/app/planos/page.tsx` (bônus)
- 15 ocorrências de genéricos corrigidas

### 13. `src/app/(app)/app/loading.tsx` (bônus)
- `bg-background` → `bg-[#f8fafc]`

### 14. `src/app/(app)/app/parceiros/loading.tsx` (bônus)
- `bg-background` → `bg-[#f8fafc]`, `bg-card` → `bg-white`

## Verificação Final
- **Zero** classes `dark:` em `src/app/(app)/`
- **Zero** `text-muted-foreground` em `src/app/(app)/`
- **Zero** `bg-primary` (standalone) em `src/app/(app)/`
- **Zero** `text-primary` (standalone) em `src/app/(app)/`
- **Zero** `bg-muted` (standalone) em `src/app/(app)/`
- **Zero** `bg-background` em `src/app/(app)/`
- **Zero** genéricos em `src/components/app/parceiros/`
- **Zero** erros de lint/TypeScript

## Lints Corrigidos
- Botão de estrelas sem `title` em `avaliar/[parceiroId]/page.tsx`
- Inline style CSS em `category-filter.tsx`
