# FIX CRÍTICO - Webhook Asaas sobrescrevendo senha do checkout

**Data:** 2026-02-13
**Tipo:** Bug Fix Crítico
**Impacto:** Login de assinantes falhava após pagamento confirmado

---

## Problema

1. Usuário criava conta no checkout com senha própria (ex: "MinhaS3nha!")
2. `POST /api/checkout/asaas` criava user com hash da senha correta + assinante PENDING
3. Webhook recebia `PAYMENT_CONFIRMED`
4. Webhook gerava senha ALEATÓRIA e **sobrescrevia** a do checkout
5. Email era enviado com senha aleatória que o usuário não escolheu
6. Login falhava com a senha original

## Causa Raiz

No `handlePaymentConfirmed` do webhook (`src/app/api/webhooks/asaas/route.ts`), o bloco de notificações gerava uma senha temporária e atualizava o user **SEMPRE**, independente de o user já ter uma senha definida.

## Correções Aplicadas

### 1. Webhook (`src/app/api/webhooks/asaas/route.ts`)

**Antes:** Sempre gerava `tempPassword` e sobrescrevia `user.password`.

**Depois:**
- Verifica se user já tem senha (`password.length > 10` = hash bcrypt existe)
- **Se tem senha (checkout):** Envia email de CONFIRMAÇÃO de pagamento (sem credenciais), usando `sendPaymentConfirmationEmail`
- **Se NÃO tem senha (admin):** Gera senha temporária normalmente e envia via `sendWelcomeNotifications`

### 2. Checkout (`src/app/api/checkout/asaas/route.ts`)

**Antes:** Enviava `sendWelcomeEmail` genérico sem credenciais.

**Depois:** Envia email HTML completo com:
- Nome do usuário
- Email de acesso
- Senha escolhida no checkout (em texto)
- Nome do plano
- Status "Aguardando confirmação de pagamento"
- Botão "Acessar Minha Conta" → `/login`

## Fluxo Corrigido

```
1. Checkout → Cria user com hash(senha_escolhida) + assinante PENDING
2. Checkout → Envia email com credenciais + "aguardando pagamento"
3. Webhook PAYMENT_CONFIRMED → Detecta que user JÁ tem senha
4. Webhook → Ativa assinante (ACTIVE) + user (isActive: true)
5. Webhook → Envia email de CONFIRMAÇÃO (sem credenciais)
6. Usuário faz login com a senha que escolheu ✅
```

## Arquivos Alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/app/api/webhooks/asaas/route.ts` | Condicional: não sobrescrever senha se user já tem |
| `src/app/api/checkout/asaas/route.ts` | Email de boas-vindas com credenciais completas |

## Checklist

- [x] Webhook: NÃO sobrescreve senha se user já tem password (veio do checkout)
- [x] Webhook: envia email de CONFIRMAÇÃO (sem credenciais) para users do checkout
- [x] Webhook: GERA senha temporária apenas para users sem senha (cadastro admin)
- [x] Checkout: envia email de boas-vindas com credenciais + status "aguardando"
- [x] Webhook: envia email de confirmação de pagamento quando aprovado
- [x] User consegue logar com a senha que definiu no checkout
- [x] Assinante ativado para ACTIVE após pagamento confirmado
- [x] planStartDate e planEndDate definidos (já existia)
- [x] Zero erros de lint
