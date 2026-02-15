# FASE 3A: UI Parceiro — Tela de Vendas com Cashback

**Data:** 2026-02-15
**Tipo:** FEATURE (UI)

## O que foi feito

Atualizada a tela de vendas do parceiro (`vendas/page.tsx`) para suportar o sistema de cashback por parceiro implementado nas Fases 1 e 2.

## Alterações

### `src/app/(parceiro)/parceiro/vendas/page.tsx`

| Alteração | Descrição |
|-----------|-----------|
| Interface `SaleData` | Substituída para usar campos da nova API (`originalAmount`, `discountAmount`, `cashbackAvailable`, `cashbackToUse`, `cashbackGenerated`, `cashbackNewBalance`, etc.) |
| Estados `useCashback` + `cashbackAvailable` | Adicionados para controlar toggle e exibir saldo |
| Fetch cashback após validar | Após identificar o cliente, busca automaticamente o cashback disponível neste parceiro via `/api/parceiro/venda/calcular` |
| Info do cliente | Mostra badge com saldo de cashback disponível neste parceiro |
| Toggle "Usar Cashback" | Seção visual com gradiente verde, botão Sim/Não, e descrição — similar ao "Usar Pontos" |
| `handleCalculate` | Envia `useCashback` no body para a API calcular |
| Dialog de confirmação | Mostra: desconto (%), pontos usados, cashback usado, total a pagar, cashback gerado e novo saldo |
| `handleConfirmSale` | Envia `cashbackUsed`, `discountApplied`, `finalAmount` para API confirmar |
| Tela de sucesso | Mostra resumo com total pago, cashback utilizado e cashback gerado |
| `handleNewSale` | Reseta estados de cashback |

## Fluxo de uso

1. Parceiro escaneia QR / digita CPF
2. Sistema valida e mostra info + cashback disponível
3. Parceiro digita valor da compra
4. Se cliente tem cashback, aparece toggle "Usar Cashback"
5. Parceiro clica "Calcular Venda"
6. Dialog mostra resumo completo (desconto + pontos + cashback)
7. Confirma → venda registrada + cashback atualizado
8. Tela de sucesso com resumo

## Verificação

- [x] Interface SaleData com campos novos
- [x] Estado useCashback + cashbackAvailable
- [x] Fetch cashback após validar cliente
- [x] Toggle visual "Usar Cashback"
- [x] handleCalculate envia useCashback
- [x] Dialog confirmação mostra cashback usado/gerado/novo saldo
- [x] handleConfirmSale envia cashbackUsed + finalAmount
- [x] Tela sucesso mostra cashback usado/gerado
- [x] handleNewSale reseta cashback
- [x] Zero erros lint
