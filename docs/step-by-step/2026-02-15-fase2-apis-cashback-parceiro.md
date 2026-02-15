# FASE 2: APIs Core — Cashback por Parceiro

**Data:** 2026-02-15

## Objetivo
Integrar o model `CashbackBalance` em todas as APIs financeiras, permitindo cashback separado por parceiro.

## APIs Modificadas

### 1. `api/parceiro/venda/calcular` (reescrito)
- Busca `CashbackBalance` do assinante neste parceiro
- Retorna `cashbackAvailable`, `cashbackToUse`, `cashbackNewBalance`
- Safety parse em `benefit.value` (string ou objeto)
- Cruza benefícios plano x parceiro (só mostra os que ambos têm)
- Novo param: `useCashback: boolean`

### 2. `api/parceiro/venda/confirmar` (reescrito)
- Validação server-side de saldo antes de usar cashback
- `CashbackBalance.upsert` atômico (gera e usa na mesma transação)
- Recalcula `assinante.cashback` global como soma dos `CashbackBalance.balance`
- Novas métricas: `cashbackIssued`, `cashbackRedeemed`
- Campo `cashbackUsed` salvo na Transaction
- Notificação via `AssinanteNotificacao` (não Notification)

### 3. `api/app/carteira` (reescrito)
- Retorna `cashbackByPartner[]` com saldo por parceiro
- Inclui `parceiroName`, `parceiroLogo`, `parceiroCategory`
- `totalCashback` = soma dos saldos (não campo global)
- Inclui `avatar` do user e `cashbackUsed` nas transações

### 4. `api/parceiro/cashback-balances` (NOVO)
- Dashboard de cashback para o parceiro
- `totalPending`, `totalIssued`, `totalRedeemed`, `clientCount`
- Lista de clientes com saldo, nome, CPF, avatar

### 5. `api/parceiro/validar` (POST adaptado)
- Safety parse em `benefit.value`
- Após incrementar `assinante.cashback`, faz `CashbackBalance.upsert`

## Adaptações Importantes
- `Parceiro.name` não existe → usado `companyName`/`tradeName`
- `Notification` model é para campanhas → usado `AssinanteNotificacao`
- `session.user.role` castado como `string` para TypeScript

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/app/api/parceiro/venda/calcular/route.ts` | Reescrito |
| `src/app/api/parceiro/venda/confirmar/route.ts` | Reescrito |
| `src/app/api/app/carteira/route.ts` | Reescrito |
| `src/app/api/parceiro/cashback-balances/route.ts` | CRIADO |
| `src/app/api/parceiro/validar/route.ts` | POST adaptado |

## Verificação
- 5 arquivos usando `cashbackBalance` — confirmado
- Zero erros lint
