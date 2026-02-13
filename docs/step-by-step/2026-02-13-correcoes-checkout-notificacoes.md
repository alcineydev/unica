# Correções Críticas - Checkout + Notificações + Fluxo Assinante

**Data:** 2026-02-13  
**Branch:** dev  

---

## Bugs Corrigidos

### 1. QR Code PIX Não Aparecia (CRÍTICO)
- **Causa:** Frontend procurava `paymentResult.pixQrCode` mas API retornava `paymentResult.pix.qrCode`
- **Arquivo:** `src/app/(public)/checkout/[planId]/page.tsx`
- **Fix:** Alterado para ler `paymentResult.pix?.qrCode`, `paymentResult.pix?.copyPaste`, `paymentResult.pix?.expirationDate`
- **Fallback mantido:** Ainda tenta propriedades flat como `pixQrCode` para compatibilidade

### 2. PaymentId Errado (CRÍTICO)
- **Causa:** Frontend usava `paymentResult.paymentId` mas API retornava `paymentResult.payment.id`
- **Arquivo:** `src/app/(public)/checkout/[planId]/page.tsx`
- **Fix:** Alterado para `paymentResult.payment?.id || paymentResult.paymentId || paymentResult.id`

### 3. Boleto Dados Errados (CRÍTICO)
- **Causa:** Frontend usava `paymentResult.bankSlipUrl` mas API retornava `paymentResult.payment.bankSlipUrl`
- **Arquivo:** `src/app/(public)/checkout/[planId]/page.tsx`
- **Fix:** Alterado para `paymentResult.payment?.bankSlipUrl || paymentResult.bankSlipUrl` (idem para `identificationField` e `dueDate`)

### 4. Sininho Admin Não Recebia Notificações
- **Causa:** O módulo `@/lib/admin-notifications` existia com `notifyNewPartner` e `notifyNewSubscriber`, mas **não era chamado** em 3 endpoints
- **Arquivos corrigidos:**
  - `src/app/api/admin/partners/route.ts` - Adicionado `notifyNewPartner` no POST
  - `src/app/api/public/registro/route.ts` - Adicionado `notifyNewSubscriber` no POST
  - `src/app/api/checkout/asaas/route.ts` - Adicionado `notifyNewSubscriber` + push no POST

### 5. Checkout Não Verificava Email Existente
- **Causa:** Checkout não buscava dados de usuário existente para pré-preencher
- **Solução:**
  - **Criado:** `src/app/api/checkout/asaas/lookup/route.ts` - API que busca dados (nome, CPF, telefone, endereço) por email
  - **Atualizado:** `checkout-personal-form.tsx` - Faz lookup no `onBlur` do campo email, preenche campos vazios e endereço
  - Email primeiro no formulário com dica "Já tem conta?"

### 6. Redirect Pós-Pagamento
- **Antes:** Redirecionava para `/login` sem contexto
- **Agora:** Redireciona para `/login?redirect=/app` em todos os pontos:
  - `checkout-pix-result.tsx` (botão "Acessar Minha Conta")
  - `checkout-boleto-result.tsx` (botão "Acessar Minha Conta")
  - `sucesso/page.tsx` (botão principal)

---

## Arquivos Criados

| Arquivo | Função |
|---------|--------|
| `src/app/api/checkout/asaas/lookup/route.ts` | API de lookup por email para pré-preencher checkout |

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/(public)/checkout/[planId]/page.tsx` | Fix mismatch PIX/Boleto/Cartão + callback `onAddressFound` |
| `src/app/(public)/checkout/[planId]/components/checkout-personal-form.tsx` | Lookup email + preenchimento auto + email primeiro |
| `src/app/(public)/checkout/[planId]/components/checkout-pix-result.tsx` | Redirect para `/login?redirect=/app` |
| `src/app/(public)/checkout/[planId]/components/checkout-boleto-result.tsx` | Redirect para `/login?redirect=/app` |
| `src/app/(public)/checkout/sucesso/page.tsx` | Redirect para `/login?redirect=/app` |
| `src/app/api/checkout/asaas/route.ts` | Adicionado notificação in-app + push |
| `src/app/api/admin/partners/route.ts` | Adicionado notificação in-app (sininho) |
| `src/app/api/public/registro/route.ts` | Adicionado notificação in-app (sininho) |

---

## Infraestrutura Existente Utilizada

| Componente | Arquivo | Status |
|------------|---------|--------|
| `createAdminNotification()` | `src/lib/admin-notifications.ts` | Já existia, agora chamado nos 3 endpoints |
| `notifyNewPartner()` | `src/lib/admin-notifications.ts` | Já existia, faltava chamar |
| `notifyNewSubscriber()` | `src/lib/admin-notifications.ts` | Já existia, faltava chamar no checkout/registro |
| `sendPushToAdmins()` | `src/lib/push-notifications.ts` | Já era chamada |
| Sininho Admin | `src/components/admin/notification-dropdown.tsx` | Funciona via `GET /api/admin/notifications` |

---

## Checklist

- [x] PIX QR Code corrigido (lê `pix.qrCode` da API)
- [x] PaymentId corrigido (lê `payment.id` da API)
- [x] Boleto dados corrigidos (lê `payment.bankSlipUrl` da API)
- [x] Sininho admin recebe notificação de novo parceiro
- [x] Sininho admin recebe notificação de novo assinante (checkout)
- [x] Sininho admin recebe notificação de registro público
- [x] Checkout verifica email existente (lookup API)
- [x] Pré-preenche dados pessoais e endereço quando email encontrado
- [x] Redirect pós-pagamento para `/login?redirect=/app`
- [x] 0 erros de lint
