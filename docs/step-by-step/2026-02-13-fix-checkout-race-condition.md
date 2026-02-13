# FIX CRÍTICO - Race Condition Checkout + Webhook Asaas

**Data:** 2026-02-13
**Tipo:** Bug Fix Crítico (3 bugs)
**Impacto:** Login, ativação de assinantes e datas de ciclo

---

## Problemas Identificados

### Bug 1: Login falha com senha do checkout
- **Causa:** `isActive: false` no checkout bloqueava login antes do webhook rodar
- **Fix:** User criado com `isActive: true` no checkout

### Bug 2: Assinante fica PENDENTE após pagamento confirmado
- **Causa 1:** Race condition - para cartão, checkout criava pagamento → webhook
  chegava antes do assinante ser criado → fallback criava assinante ACTIVE →
  checkout continuava e sobrescrevia para PENDING
- **Causa 2:** Para subscriptions, `subscriptionResponse.id` (sub_xxx) era salvo
  como `asaasPaymentId`, mas webhook recebia o `payment.id` real (pay_xxx)
- **Fix:** Criar user+assinante ANTES do pagamento + salvar payment ID real

### Bug 3: Sem datas de ciclo
- **Causa:** Consequência do Bug 2 (dados existiam mas status errado)
- **Fix:** Datas calculadas e salvas antes do pagamento

---

## Correções Aplicadas

### 1. Checkout (`src/app/api/checkout/asaas/route.ts`) - REESCRITO

**Novo fluxo (ordem importa!):**
1. Validações
2. Buscar plano
3. Calcular datas do ciclo
4. Criar/buscar customer no Asaas
5. **Criar user+assinante no banco ANTES do pagamento** ← Elimina race condition
6. Criar cobrança no Asaas (agora o assinante já existe)
7. Atualizar assinante com payment ID real (pay_xxx)
8. Se cartão aprovado instantaneamente → ativar na hora
9. Email de boas-vindas com credenciais
10. Notificações admin (in-app + push)
11. Buscar dados PIX (se necessário)
12. Retornar resultado

**Mudanças chave:**
- `isActive: true` no checkout (login imediato)
- `externalReference: assinante.id` na cobrança (webhook encontra por ID)
- `asaasPaymentId` atualizado DEPOIS de `createPayment` (payment ID real)
- Proteção: se assinante já ACTIVE, retorna 409 (evita duplicação)
- Usa funções existentes de `@/lib/asaas` (não duplica API helpers)
- Address salvo como JSON no campo `address` (schema correto)
- QR Code gerado automaticamente (campo obrigatório)

### 2. Webhook (`src/app/api/webhooks/asaas/route.ts`) - PROTEÇÃO

**Mudança:** Adicionada verificação antes de processar:
- Se assinante já é `ACTIVE` (ativado no checkout): apenas garante payment ID
  e user ativo, depois retorna sem processar mais
- Busca agora também por `externalReference` (assinante.id)

---

## Fluxo Corrigido

### PIX
```
Checkout → Cria user(active) + assinante(PENDING) → Cria cobrança → Retorna QR
User paga PIX → Webhook PAYMENT_CONFIRMED → Encontra assinante → Ativa (ACTIVE)
User faz login com senha do checkout ✅
```

### Cartão de Crédito
```
Checkout → Cria user(active) + assinante(PENDING) → Cria cobrança
  → Cartão aprovado instantâneo? → Ativa assinante na hora
  → Webhook chega depois → Verifica: já ACTIVE? → Apenas garante dados → Return
User faz login com senha do checkout ✅
```

### Boleto
```
Checkout → Cria user(active) + assinante(PENDING) → Cria cobrança → Retorna boleto
Dias depois: banco confirma → Webhook PAYMENT_CONFIRMED → Ativa assinante
User faz login com senha do checkout (já podia desde o checkout) ✅
```

---

## Checklist

- [x] User criado com `isActive: true` (login imediato)
- [x] Assinante criado ANTES da cobrança (elimina race condition)
- [x] `asaasPaymentId` correto (pay_xxx, nunca sub_xxx)
- [x] Proteção: assinante ACTIVE não regride para PENDING
- [x] Cartão aprovado instantâneo → checkout ativa na hora
- [x] Webhook: se ACTIVE, não reprocessar
- [x] Webhook: não sobrescrever senha (fix anterior mantido)
- [x] Email boas-vindas com credenciais
- [x] Notificações admin (in-app + push)
- [x] Datas de ciclo calculadas e salvas
- [x] Compatível com frontend existente
- [x] Zero erros de lint

## Arquivos Alterados

| Arquivo | Ação |
|---------|------|
| `src/app/api/checkout/asaas/route.ts` | REESCRITO - fluxo sem race condition |
| `src/app/api/webhooks/asaas/route.ts` | FIX - proteção race condition + busca por externalReference |
