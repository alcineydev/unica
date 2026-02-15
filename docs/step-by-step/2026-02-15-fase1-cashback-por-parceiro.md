# FASE 1: Cashback por Parceiro — Schema + Migração

**Data:** 2026-02-15

## Problema
Cashback era um campo único no Assinante (`cashback: Decimal`), sem separação por parceiro. Impossível saber quanto cashback cada parceiro gerou.

## Solução
Novo model `CashbackBalance` com chave composta `assinanteId + parceiroId`, rastreando saldo, total ganho e total usado por par.

## Alterações no Schema

### Novo model: `CashbackBalance`
- `id`, `assinanteId`, `parceiroId` (unique compound)
- `balance`, `totalEarned`, `totalUsed` — Decimal(10,2)
- Tabela: `cashback_balances`
- Índices: `assinanteId`, `parceiroId`

### Campo adicionado: `Transaction.cashbackUsed`
- `cashbackUsed Decimal @default(0) @db.Decimal(10, 2)`
- Após `cashbackGenerated`

### Relações adicionadas
- `Assinante.cashbackBalances → CashbackBalance[]`
- `Parceiro.cashbackBalances → CashbackBalance[]`

## Migração de Dados
- Script: `prisma/seed-cashback-balances.ts`
- Agrega transações COMPLETED com `cashbackGenerated > 0` por par assinante+parceiro
- Resultado: 1 registro criado, R$ 5,00 de cashback migrado

## Arquivos

| Arquivo | Ação |
|---------|------|
| `prisma/schema.prisma` | CashbackBalance model + cashbackUsed field + relações |
| `prisma/seed-cashback-balances.ts` | Script de migração de dados existentes |

## Verificação
- `npx prisma validate` — Schema válido
- `npx prisma db push` — Tabela criada no banco
- `npx prisma generate` — Client gerado
- Seed executado — 1 registro, R$ 5,00
- Zero erros lint
