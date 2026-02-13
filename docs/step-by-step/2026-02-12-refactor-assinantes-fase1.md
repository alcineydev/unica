# Refatoração Assinantes - Fase 1: Limpeza + Criação Simplificada

**Data:** 12/02/2026
**Fase:** 1 de N

## O que foi feito

### 1. Deletar API Legada `/api/admin/subscribers/`
- Removida pasta `src/app/api/admin/subscribers/` completa
- Continha `route.ts` (CRUD) e `[id]/route.ts` (individual)
- Era duplicata não utilizada da API `/api/admin/assinantes/`
- Nenhuma referência a esta rota foi encontrada no projeto

### 2. Refatorar API GET - `/api/admin/assinantes/route.ts`
**Antes:**
- GET não incluía `city` no Prisma query → listagem mostrava `undefined`
- GET não incluía `_count.transactions`
- GET retornava array direto (sem wrapper `{ data: [] }`)
- POST exigia CPF e senha como obrigatórios

**Depois:**
- GET inclui `user`, `plan`, `city`, `_count.transactions`
- GET retorna `{ data: assinantes }` (formato padronizado)
- Filtros: search, status, planId, cityId
- POST simplificado: apenas nome e email são obrigatórios
- Senha padrão `Unica@2025` se não informada
- CPF validado apenas se informado
- QR Code gerado automaticamente
- Email de boas-vindas enviado (non-blocking)
- Notificação admin enviada (non-blocking)
- Retorna `{ message, data }` com status 201

### 3. Refatorar Formulário de Criação - `/admin/assinantes/novo`
**Antes:**
- Formulário complexo exigindo muitos campos obrigatórios
- CPF e senha eram obrigatórios

**Depois:**
- Formulário simplificado (padrão similar aos parceiros)
- Apenas nome e email são obrigatórios
- CPF, telefone, senha são opcionais
- Plano e cidade são opcionais (podem ser definidos na edição)
- Status inicial selecionável (Pendente/Ativo/Convidado)
- Máscaras de CPF e telefone
- Após criar, redireciona para `/admin/assinantes/[id]` (edição)
- UI com Cards separados: "Dados Principais" e "Plano e Localização"

### 4. Ajustar Listagem `/admin/assinantes/page.tsx`
- Corrigido parse da resposta: `data.data || []` (era `data.assinantes || []`)
- Corrigido fetch de planos: `/api/admin/plans` (era `/api/admin/planos` que não existia)
- Parse de planos: `data.data || []` (era `data.plans || []`)

### 5. Garantir City no GET `/api/admin/assinantes/[id]`
- Já existia `city` no include, mas com select limitado
- Alterado para `plan: true` e `city: true` (retorna todos os campos)
- Adicionado `isActive` e `phone` no select do user

### 6. Limpeza de Referências
- Verificado: nenhuma referência a `/api/admin/subscribers` encontrada no projeto
- Todas as chamadas usam `/api/admin/assinantes` corretamente

## Arquivos Alterados

| Arquivo | Ação |
|---------|------|
| `src/app/api/admin/subscribers/` | **DELETADO** (inteiro) |
| `src/app/api/admin/assinantes/route.ts` | Reescrito (GET + POST) |
| `src/app/(admin)/admin/assinantes/novo/page.tsx` | Reescrito (formulário simplificado) |
| `src/app/(admin)/admin/assinantes/page.tsx` | Corrigido parse resposta + URL planos |
| `src/app/api/admin/assinantes/[id]/route.ts` | Ajustado includes |

## Impacto

- **Zero breaking changes** na página de edição (`[id]/page.tsx`)
- **Zero breaking changes** nas ações em lote (`bulk/route.ts`)
- Formato de resposta padronizado com `{ data: [...] }` 
- Criação de assinantes muito mais rápida (apenas 2 campos obrigatórios)
