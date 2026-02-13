# Refatoração Assinantes - Fase 2: Página de Edição com Tabs + Sidebar

**Data:** 12/02/2026
**Fase:** 2 de N

## O que foi feito

### 1. API GET `/api/admin/assinantes/[id]` - Reescrita Completa

**Antes:** Retornava apenas o assinante com include básico.

**Depois:** Retorna um objeto completo para a página de edição:
- `data`: assinante com user, plan, city, transactions (50 últimas), _count
- `plans`: lista de planos ativos (para select)
- `cities`: lista de cidades ativas (para select)
- `stats`: agregação de transações (totalSpent, totalCashback, totalPointsUsed, totalDiscounts)
- `charts.timeline`: movimentação mensal dos últimos 6 meses (agrupado)
- `charts.byType`: distribuição de transações por tipo

### 2. API PATCH `/api/admin/assinantes/[id]` - Reescrita Completa

**Antes:** PATCH simples sem validação de duplicidade.

**Depois:**
- Atualiza User e Assinante em transação Prisma
- Valida email duplicado (se alterado)
- Valida CPF duplicado (se alterado)
- Suporta alteração de senha com hash bcrypt
- Suporta todos os campos: dados pessoais, plano, cidade, status, endereço, pontos, cashback, datas de assinatura

### 3. API DELETE `/api/admin/assinantes/[id]` - Com Force

- Verifica se tem transações vinculadas
- Se `?force=true`, exclui mesmo assim (via cascade no User)
- Se não, retorna 400 com detalhes das transações

### 4. Componentes Criados (5 tabs + sidebar)

| Componente | Função |
|-----------|--------|
| `subscriber-sidebar.tsx` | Avatar, nome, status, QR Code, métricas, controles (status/plano/cidade/ativo) |
| `subscriber-personal-tab.tsx` | Nome, email, CPF, telefone, data nascimento, senha |
| `subscriber-address-tab.tsx` | Endereço com busca de CEP via ViaCEP |
| `subscriber-plan-tab.tsx` | Plano atual, datas da assinatura, saldo pontos/cashback, dados Asaas |
| `subscriber-financial-tab.tsx` | Cards de resumo + tabela de transações com filtros |
| `subscriber-activity-tab.tsx` | Gráficos CSS (timeline 6 meses + distribuição por tipo) |

### 5. Página Principal `[id]/page.tsx` - Layout Tabs + Sidebar

- Layout responsivo: `grid lg:grid-cols-[1fr_320px]`
- Sidebar aparece primeiro no mobile (order-first), último no desktop (lg:order-last)
- 5 tabs: Dados Pessoais, Endereço, Plano, Financeiro, Atividade
- Sidebar com controles que salvam imediatamente (updateDirect)
- Formulário principal salva com botão "Salvar Alterações"
- Indicador de mudanças não salvas (hasChanges)
- Exclusão com AlertDialog e confirmação
- Loading state com Skeletons

## Arquivos Criados/Alterados

| Arquivo | Ação |
|---------|------|
| `src/app/api/admin/assinantes/[id]/route.ts` | REESCRITO |
| `src/app/(admin)/admin/assinantes/[id]/page.tsx` | REESCRITO |
| `src/app/(admin)/admin/assinantes/[id]/components/subscriber-sidebar.tsx` | CRIADO |
| `src/app/(admin)/admin/assinantes/[id]/components/subscriber-personal-tab.tsx` | CRIADO |
| `src/app/(admin)/admin/assinantes/[id]/components/subscriber-address-tab.tsx` | CRIADO |
| `src/app/(admin)/admin/assinantes/[id]/components/subscriber-plan-tab.tsx` | CRIADO |
| `src/app/(admin)/admin/assinantes/[id]/components/subscriber-financial-tab.tsx` | CRIADO |
| `src/app/(admin)/admin/assinantes/[id]/components/subscriber-activity-tab.tsx` | CRIADO |

## Arquitetura

```
[id]/
├── page.tsx                    (página principal - tabs + sidebar)
└── components/
    ├── subscriber-sidebar.tsx  (controles rápidos + métricas)
    ├── subscriber-personal-tab.tsx  (dados pessoais + senha)
    ├── subscriber-address-tab.tsx   (endereço + busca CEP)
    ├── subscriber-plan-tab.tsx      (plano + datas + saldo)
    ├── subscriber-financial-tab.tsx (transações + resumo)
    └── subscriber-activity-tab.tsx  (gráficos CSS + info conta)
```

## Fluxo de Dados

1. **Fetch inicial**: GET `/api/admin/assinantes/[id]` retorna tudo em uma chamada
2. **Sidebar (updateDirect)**: PATCH imediato → refetch completo
3. **Tabs (updateFormData)**: Atualiza formData local → marca hasChanges → PATCH ao clicar "Salvar"
4. **Delete**: DELETE com `?force=true` → redireciona para listagem
