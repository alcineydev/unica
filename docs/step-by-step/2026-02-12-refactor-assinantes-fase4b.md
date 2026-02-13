# Fase 4B: Fluxo de Planos + Checkout Asaas

**Data:** 2026-02-12
**Objetivo:** Corrigir fluxo completo de planos, checkout e cadastro

---

## Arquivos Alterados

### 1. `src/app/api/app/planos/route.ts` — REESCRITO
- **GET** retorna `{ plans, currentPlan, currentPlanId, subscription }`
- `currentPlan` é o objeto completo do plano ativo (não apenas o ID)
- `subscription` inclui status, startDate e endDate
- Planos formatados com benefícios, features, preços e slug
- Extração inteligente de valor dos benefícios (percentage, value, multiplier, etc.)

### 2. `src/app/api/app/checkout/route.ts` — REESCRITO
- **Plano gratuito** (price <= 0): ativa direto via Prisma, sem expiração
- **Plano pago com slug**: retorna `{ checkoutUrl: /checkout/${slug} }` para Asaas
- **Plano pago sem slug**: retorna erro orientando contato com suporte
- Validação de plano já ativo (evita duplicação)
- Verificação de assinante existente

### 3. `src/app/(app)/app/planos/page.tsx` — REESCRITO
- UI premium com cards por plano
- Badge "Ativo" (verde) no plano atual
- Badge "Mais Popular" no plano do meio
- **Plano gratuito**: botão "Ativar Grátis" → POST `/api/app/checkout` → ativa direto
- **Plano pago com slug**: botão "Assinar Plano" → redirect `/checkout/${slug}` (Asaas)
- **Plano pago sem slug**: fallback via API checkout
- Loading skeleton, estados de processamento
- Referência "Pagamento seguro via Asaas" (antes era Mercado Pago)

### 4. `src/app/(app)/app/page.tsx` — AJUSTADO
- Links dos cards de plano mudaram de `/checkout?plano=${plan.id}` para `/app/planos`
- Evita rota quebrada de checkout antigo

### 5. `src/app/(auth)/cadastro/page.tsx` — AJUSTADO
- Redirect pós-cadastro mudou de `/checkout?plano=${planId}` para `/app/planos`
- Fallback de login falho redireciona para `/login`

---

## Fluxo Completo

```
Cadastro → Login → Home (sem plano) → /app/planos → 
  ├── Plano Grátis → POST /api/app/checkout → Ativado direto → /app
  └── Plano Pago  → Redirect /checkout/{slug} → Asaas → Webhook → Ativado
```

## Checklist
- [x] `/app/planos` carrega planos do `/api/app/planos`
- [x] Mostra plano atual com badge "Ativo"
- [x] "Assinar Plano" em pago redireciona para `/checkout/[slug]` (Asaas)
- [x] "Ativar Grátis" em gratuito chama POST `/api/app/checkout`
- [x] API retorna `{ plans, currentPlan }`
- [x] API checkout ativa plano gratuito com datas corretas
- [x] Home sem plano direciona para `/app/planos`
- [x] Cadastro redireciona para `/app/planos` ou `/login`
- [x] Webhook Asaas não foi alterado
- [x] Zero referências quebradas a `/checkout?plano=`
- [x] Zero erros de lint
