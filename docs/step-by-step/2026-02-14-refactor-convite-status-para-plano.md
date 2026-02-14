# REFACTOR: Convite — De Status para Plano

**Data:** 2026-02-14  
**Tipo:** Refactor — Migração de lógica de negócio

---

## Problema
O status `GUEST` no enum `SubscriptionStatus` representava "convidado com acesso total", mas:
- A lógica de "liberar tudo" ficava espalhada no código
- Não seguia o padrão modular de benefícios via plano
- Difícil de gerenciar e auditar

## Solução
"Convite" agora é um **Plano** (slug: `convite`, preço R$ 0) com **todos os benefícios** vinculados via `PlanBenefit`. Assinantes convidados têm `planId = convite` + `subscriptionStatus = ACTIVE`, seguindo a mesma lógica de qualquer outro plano.

---

## Arquivos Criados

### 1. `prisma/seed-convite.ts`
- **Função:** Script de migração para executar uma vez
- **Ações:**
  1. Busca todos os benefícios existentes
  2. Cria/atualiza plano "Convite" (slug: `convite`, preço 0, features descritivas)
  3. Vincula TODOS os benefícios ao plano Convite via `PlanBenefit`
  4. Migra assinantes com `subscriptionStatus: GUEST` → `planId: convite` + `status: ACTIVE`
- **Execução:** `npx tsx prisma/seed-convite.ts`

---

## Arquivos Alterados

### 2. `src/app/api/admin/benefits/route.ts`
- **POST:** Após criar benefício, auto-vincula ao plano Convite (se existir)
- **Garante:** Novos benefícios sempre ficam disponíveis para convidados

### 3. `src/app/api/plans/public/route.ts`
- **WHERE:** Adicionado `NOT: { slug: 'convite' }` para ocultar da listagem pública

### 4. `src/app/api/public/plans/route.ts`
- **WHERE:** Adicionado `NOT: { slug: 'convite' }` para ocultar da listagem pública

### 5. `src/app/api/app/planos/route.ts`
- **WHERE:** Adicionado `NOT: { slug: 'convite' }` para ocultar da tela de planos do assinante

### 6. `src/app/api/app/home/route.ts`
- **WHERE:** Adicionado `NOT: { slug: 'convite' }` nos planos disponíveis para upgrade

### 7. `src/app/api/checkout/asaas/route.ts`
- **Validação:** Bloqueia checkout se `plan.slug === 'convite'` (retorna 403)

### 8. `src/app/(admin)/admin/assinantes/novo/page.tsx`
- **Select Status:** Removida opção "Convidado" (GUEST)
- **Agora:** Admin seleciona plano Convite + status ACTIVE

### 9. `src/app/(admin)/admin/assinantes/[id]/components/subscriber-sidebar.tsx`
- **Select Status:** Removida opção "Convidado" (GUEST) do dropdown
- **STATUS_MAP:** GUEST renomeado para "Convidado (legado)" como fallback visual

### 10. `src/app/(admin)/admin/assinantes/page.tsx`
- **STATUS_MAP:** GUEST renomeado para "Convidado (legado)"

### 11. `src/app/(admin)/admin/assinantes/components/subscribers-dashboard.tsx`
- **STATUS_LABELS:** GUEST renomeado para "Convidados (legado)"

---

## Fluxo — Antes vs Depois

| Aspecto | Antes (GUEST) | Depois (Plano Convite) |
|---------|---------------|----------------------|
| Representação | Status enum | Plano com slug `convite` |
| Benefícios | Lógica especial | PlanBenefit (mesma de qualquer plano) |
| Novo benefício | Manual | Auto-vinculado |
| Controle admin | Mudar status | Selecionar plano + status ACTIVE |
| Checkout | Podia ser explorado | Bloqueado (403) |
| Listagens | Aparecia | Oculto de públicas |

---

## Verificação
- Zero erros de lint introduzidos
- Enum GUEST mantido no schema (compatibilidade)
- Labels "(legado)" nos dashboards admin
- Script de migração idempotente (upsert)
