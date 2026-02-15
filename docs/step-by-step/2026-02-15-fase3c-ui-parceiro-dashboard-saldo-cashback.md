# FASE 3C: UI Parceiro — Dashboard + Saldo com Cashback

**Data:** 2026-02-15
**Tipo:** FEATURE (API + UI)

## O que foi feito

Integradas métricas de cashback no dashboard e na página de saldo do parceiro, permitindo visualizar cashback emitido, resgatado, pendente e a lista de clientes com saldo.

## Alterações

### `src/app/api/parceiro/dashboard/route.ts`
- Adicionada query `prisma.cashbackBalance.aggregate` para buscar totais (emitido, resgatado, pendente)
- Adicionada query `prisma.cashbackBalance.count` para clientes com saldo > 0
- Retorna campo `cashback` no objeto de resposta

### `src/app/(parceiro)/parceiro/page.tsx` (Dashboard UI)
- Interface `DashboardData`: adicionado campo `cashback?` com métricas
- Import `Wallet` do lucide-react
- 2 cards novos: "Cashback Emitido" (azul) + "Cashback Pendente" (âmbar)
- Cards só aparecem se `totalIssued > 0` (sem poluir dashboard de parceiro sem cashback)

### `src/app/api/parceiro/saldo/route.ts`
- Adicionada query `prisma.cashbackBalance.findMany` com include do assinante (name, cpf, avatar)
- Calcula `cashbackTotals` (pending, issued, redeemed) via reduce
- Retorna `cashbackBalances[]` e `cashbackTotals` no objeto de resposta

### `src/app/(parceiro)/parceiro/saldo/page.tsx` (Saldo UI)
- Interface `CashbackClient` criada
- Interface `SaldoData`: adicionados `cashbackTotals?` e `cashbackBalances?`
- Imports: `Wallet`, `Users`, `Avatar/AvatarFallback/AvatarImage`
- Seção "Cashback dos Clientes" com:
  - Header com total pendente
  - 3 cards resumo: Emitido (azul), Resgatado (verde), Pendente (âmbar)
  - Lista de clientes com avatar, nome, CPF mascarado, saldo e total ganho
- Seção só aparece se existirem clientes com saldo

## Verificação

- [x] API dashboard: cashback metrics (issued/redeemed/pending/clients)
- [x] Dashboard UI: 2 cards novos (emitido + pendente)
- [x] API saldo: cashbackBalances + totals
- [x] Saldo UI: resumo 3 cards (emitido/resgatado/pendente)
- [x] Saldo UI: lista clientes com avatar/nome/CPF/saldo
- [x] CPF parcialmente mascarado na lista
- [x] Zero erros lint
