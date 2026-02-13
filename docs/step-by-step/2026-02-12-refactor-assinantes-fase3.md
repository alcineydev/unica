# Refatoração Assinantes - Fase 3: Listagem Premium com Dashboard

**Data:** 12/02/2026
**Fase:** 3 de N

## O que foi feito

### 1. API Stats `/api/admin/assinantes/stats`

Endpoint dedicado que retorna todas as métricas agregadas para o dashboard:

- **totals**: total, active, pending, inactive, canceled, guest
- **revenue**: receita mensal estimada (ativos × preço plano), receita por assinante
- **trends**: novos últimos 30 dias, cancelados últimos 30 dias, taxa de conversão
- **charts.byStatus**: distribuição por status (para gráfico de barras)
- **charts.byPlan**: distribuição por plano com nome e preço
- **charts.semPlano**: count de assinantes sem plano
- **charts.monthlyNew**: novos assinantes mês a mês (últimos 6 meses)

### 2. Componente Dashboard `subscribers-dashboard.tsx`

Dashboard visual com 3 seções:

**Linha 1 - Cards de Métricas (4 cards):**
- Total Assinantes + novos últimos 30 dias
- Ativos + taxa de conversão
- Receita Mensal + receita por assinante
- Pendentes + cancelados últimos 30 dias

**Linha 2 - Gráficos (2 colunas):**
- Gráfico de barras CSS "Novos Assinantes" (últimos 6 meses) - 2/3 da largura
- Gráfico "Por Status" com barras horizontais coloridas - 1/3 da largura

**Linha 3 - Distribuição por Plano:**
- Grid de cards mostrando assinantes por plano com preço e percentual
- Card especial para "Sem Plano" com border dashed

### 3. Listagem Reescrita `page.tsx`

Página completamente reescrita com:

- **Header**: título, contagem, botões (toggle dashboard, refresh, novo assinante)
- **Dashboard**: componente dashboard no topo (toggle via botão)
- **Filtros**: busca com debounce 400ms, status, plano, cidade, botão limpar
- **Bulk Actions**: barra de ações em lote (ativar, desativar, suspender, excluir)
- **Tabela Desktop**: checkbox, avatar com inicial, nome+email, contato (tel+cpf), plano, cidade, status, transações, menu de ações
- **Cards Mobile**: layout compacto com checkbox, avatar, nome, email, status, plano, cidade, botões editar/excluir
- **Delete Dialog**: confirmação com AlertDialog
- **Loading**: skeletons para tabela e cards
- **Estado vazio**: ícone e mensagem quando sem resultados

**Filtros são server-side** (enviados como query params para a API), não client-side. Busca tem debounce de 400ms.

## Arquivos Criados/Alterados

| Arquivo | Ação |
|---------|------|
| `src/app/api/admin/assinantes/stats/route.ts` | CRIADO |
| `src/app/(admin)/admin/assinantes/components/subscribers-dashboard.tsx` | CRIADO |
| `src/app/(admin)/admin/assinantes/page.tsx` | REESCRITO |

## Arquitetura Final do Módulo Assinantes

```
assinantes/
├── page.tsx                          (listagem premium + dashboard)
├── novo/
│   └── page.tsx                      (formulário simplificado - Fase 1)
├── components/
│   └── subscribers-dashboard.tsx     (dashboard stats + gráficos)
└── [id]/
    ├── page.tsx                      (edição com tabs + sidebar - Fase 2)
    └── components/
        ├── subscriber-sidebar.tsx
        ├── subscriber-personal-tab.tsx
        ├── subscriber-address-tab.tsx
        ├── subscriber-plan-tab.tsx
        ├── subscriber-financial-tab.tsx
        └── subscriber-activity-tab.tsx

API:
├── /api/admin/assinantes/
│   ├── route.ts        (GET list + POST create)
│   ├── stats/route.ts  (GET dashboard stats)
│   ├── bulk/route.ts   (POST bulk actions)
│   └── [id]/route.ts   (GET detail + PATCH update + DELETE)
```

## Impacto

- Dashboard dá visibilidade completa do negócio de assinaturas
- Filtros server-side reduzem dados transferidos
- Debounce na busca evita chamadas excessivas
- Toggle do dashboard permite foco na tabela quando necessário
- Zero dependências externas para gráficos (CSS puro)
