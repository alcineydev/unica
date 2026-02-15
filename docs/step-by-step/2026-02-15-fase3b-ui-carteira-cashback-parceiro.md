# FASE 3B: UI Carteira Assinante — Cashback por Parceiro

**Data:** 2026-02-15
**Tipo:** FEATURE (UI)

## O que foi feito

Atualizada a tela da carteira do assinante (`carteira/page.tsx`) para exibir cashback detalhado por parceiro, consumindo os novos dados da API (`cashbackByPartner`, `totalCashback`).

## Alterações

### `src/app/(app)/app/carteira/page.tsx`

| Alteração | Descrição |
|-----------|-----------|
| Interface `CashbackByPartner` | Nova interface com `parceiroId`, `parceiroName`, `parceiroLogo`, `parceiroCategory`, `balance`, `totalEarned`, `totalUsed` |
| Interface `Transaction` | Adicionados `cashbackUsed`, `discountApplied`; campo `parceiro` atualizado para `{ id, name, logo }` |
| Interface `CarteiraData` | Adicionados `cashbackByPartner[]`, `totalCashback` |
| Import `next/image` | Adicionado para usar `<Image>` no logo do parceiro |
| Import `Store`, `Wallet` | Adicionados do lucide-react |
| `activeTab` | Expandido para `'qrcode' \| 'cashback' \| 'extrato'` |
| Hero saldo | Usa `data.totalCashback` (soma real) + texto "disponível em N parceiros" |
| 3 tabs | Carteirinha \| Cashback \| Extrato |
| Tab Cashback | Resumo (total disponível + qtd parceiros), dica sobre regra, lista de parceiros com logo/nome/categoria/saldo/ganho/usado, estado vazio |
| Extrato | Mostra `cashbackUsed` (laranja) e `discountApplied` (azul) por transação |
| Nome parceiro | Atualizado para usar `tx.parceiro?.name` (campo já compilado pela API) |
| `handleDownload` | Trocado `new Image()` por `document.createElement('img')` para evitar conflito com import `next/image` |

## Verificação

- [x] Interface CashbackByPartner adicionada
- [x] Interface Transaction com cashbackUsed + discountApplied
- [x] CarteiraData com cashbackByPartner + totalCashback
- [x] 3 tabs: Carteirinha | Cashback | Extrato
- [x] Hero mostra totalCashback + "em N parceiros"
- [x] Tab Cashback: resumo (disponível + parceiros)
- [x] Tab Cashback: dica sobre regra
- [x] Tab Cashback: lista parceiros com logo/nome/saldo/ganho/usado
- [x] Tab Cashback: estado vazio elegante
- [x] Extrato mostra cashbackUsed e discountApplied
- [x] Nome parceiro usando campo correto
- [x] Zero erros lint
