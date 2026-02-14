# Fase 4B: Carousel Fix + Transações Recentes + Redesign Parceiros

**Data:** 2026-02-14
**Escopo:** Fix carousel, nova API, novo componente, redesign parceiros

## Arquivos Alterados/Criados

### 1. `src/components/app/home/carousel-destaques.tsx` — FIX
- `bg-muted` → `bg-gray-100`
- `from-primary to-primary/80` → `from-blue-600 to-blue-500`
- Adicionado `title` nos 3 botões (prev, next, indicadores) para acessibilidade

### 2. `src/app/api/app/transactions/route.ts` — CRIADO
- API GET para transações do assinante autenticado
- Parâmetro `?limit=N` (max 50, default 10)
- Retorna: id, type, amount, cashback, discount, pointsUsed, description, status, createdAt, parceiro (name, logo, category)
- Filtro por `assinanteId` com autenticação via session

### 3. `src/components/app/home/recent-transactions.tsx` — CRIADO
- Componente standalone para transações recentes
- Props: `showValues` (boolean) para toggle de privacidade
- TYPE_CONFIG com ícones e cores por tipo (PURCHASE, CASHBACK, BONUS, MONTHLY_POINTS, REFUND)
- formatDate relativo (agora, Xh atrás, ontem, X dias, dd/mmm)
- Logo do parceiro no ícone quando disponível
- Retorna `null` se não houver transações (sem poluir a UI)
- Loading com skeletons animados

### 4. `src/components/app/home/index.ts` — ATUALIZADO
- Adicionado export `RecentTransactions`

### 5. `src/app/(app)/app/page.tsx` — ATUALIZADO
- Import de `RecentTransactions`
- Seção "Atividade Recente" entre "Parceiros do Plano" e "Upgrade"
- Integrado com toggle `showValues` da home

### 6. `src/app/(app)/app/parceiros/page.tsx` — REESCRITO
- Cards iguais à home (logo 48px, nome, rating estrela, cidade, badge desconto)
- Header sticky com backdrop-blur `bg-[#f8fafc]/95`
- Botão "Limpar" filtros em text-blue com ícone X
- Loading: skeletons de cards (não spinner centralizado)
- Empty state: ícone em box arredondado + texto + botão limpar
- Subtítulo: "X parceiros encontrados"
- Removido import de `ParceiroCardGrid` (cards inline agora)

## Verificação
- Zero genéricos no carousel
- Zero genéricos na página de parceiros
- Zero erros lint/TypeScript
- Acessibilidade: title em todos os botões do carousel
