# 🔧 CORREÇÃO - Listagem undefined% + Exclusão Forçada

**Data:** 12/02/2026  
**Tipo:** Correção (Bug Fix + Feature)  
**Módulo:** Admin - Benefícios  
**Status:** ✅ Implementado

---

## 📋 CONTEXTO

### Problemas Identificados

1. **Listagem exibindo "undefined%":**
   - Benefícios criados antes da mudança de estrutura tinham formato diferente
   - `formatValue()` só esperava o novo formato
   - Exemplo: benefícios antigos com `{percentage: 15}` vs novo `{type: 'percentage', value: 15}`

2. **Exclusão bloqueada por vínculos:**
   - Tabelas `PlanBenefit` e `BenefitAccess` ainda tinham registros órfãos
   - Não havia opção de forçar exclusão removendo vínculos
   - Admin ficava impossibilitado de limpar dados antigos

---

## 🎯 SOLUÇÃO IMPLEMENTADA

### 1. FORMATVALUE RETROCOMPATÍVEL

**Arquivo:** `src/app/(admin)/admin/beneficios/page.tsx`

**Mudanças:**

```typescript
function formatValue(benefit: Benefit): string {
  const value = benefit.value as Record<string, number | string | undefined>
  
  if (!value || typeof value !== 'object') {
    return '-'
  }
  
  switch (benefit.type) {
    case 'DESCONTO':
      // Formato novo: {type: 'percentage'|'fixed', value: number}
      if (value.type === 'percentage' && value.value !== undefined) {
        return `${value.value}%`
      }
      if (value.type === 'fixed' && value.value !== undefined) {
        return `R$ ${value.value}`
      }
      // Formato antigo: {percentage: number}
      if (value.percentage !== undefined) {
        return `${value.percentage}%`
      }
      // Fallback: tentar qualquer valor numérico
      if (value.value !== undefined) {
        return `${value.value}%`
      }
      return '-'
      
    case 'CASHBACK':
      if (value.percentage !== undefined) {
        return `${value.percentage}%`
      }
      return '-'
      
    case 'PONTOS':
      // Formato novo: {multiplier: number}
      if (value.multiplier !== undefined) {
        return `${value.multiplier}x pontos`
      }
      // Formato antigo: {monthlyPoints: number}
      if (value.monthlyPoints !== undefined) {
        return `${value.monthlyPoints} pts/mês`
      }
      return '-'
      
    case 'ACESSO_EXCLUSIVO':
      if (value.description) {
        const desc = String(value.description)
        return desc.length > 30 ? desc.substring(0, 30) + '...' : desc
      }
      return 'Premium'
      
    default:
      return '-'
  }
}
```

**Estratégia:**

1. **Verificação de existência:** `if (!value || typeof value !== 'object') return '-'`
2. **Múltiplos formatos por tipo:**
   - DESCONTO: tenta `{type, value}`, depois `{percentage}`, depois fallback
   - PONTOS: tenta `{multiplier}`, depois `{monthlyPoints}`
3. **Fallback seguro:** retorna `-` se nada for encontrado
4. **Type safety:** usa `undefined` checks para evitar erros

---

### 2. EXCLUSÃO FORÇADA - API INDIVIDUAL

**Arquivo:** `src/app/api/admin/benefits/[id]/route.ts`

**Mudanças:**

```typescript
export async function DELETE(request: Request, { params }: RouteParams) {
  // ... auth checks ...

  const { id } = await params
  
  // ✨ NOVO: query param para forçar
  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'

  const benefit = await prisma.benefit.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          planBenefits: true,
          benefitAccess: true, // ✨ NOVO: verifica ambos
        },
      },
    },
  })

  if (!benefit) {
    return NextResponse.json({ error: 'Benefício não encontrado' }, { status: 404 })
  }

  const hasRelations = benefit._count.planBenefits > 0 || benefit._count.benefitAccess > 0

  // ✨ NOVO: bloqueia se tem vínculos e não é forçado
  if (hasRelations && !force) {
    return NextResponse.json({
      error: `Benefício vinculado a ${benefit._count.planBenefits} plano(s) e ${benefit._count.benefitAccess} parceiro(s).`,
      details: {
        planBenefits: benefit._count.planBenefits,
        benefitAccess: benefit._count.benefitAccess,
      }
    }, { status: 400 })
  }

  // ✨ NOVO: se forçado, deletar vínculos primeiro
  if (hasRelations && force) {
    await prisma.$transaction([
      prisma.planBenefit.deleteMany({ where: { benefitId: id } }),
      prisma.benefitAccess.deleteMany({ where: { benefitId: id } }),
      prisma.benefit.delete({ where: { id } }),
    ])
  } else {
    await prisma.benefit.delete({ where: { id } })
  }

  return NextResponse.json({ message: 'Benefício excluído com sucesso' })
}
```

**Fluxo:**

1. Recebe `?force=true` via query param
2. Busca benefício com contadores de vínculos
3. Se tem vínculos e NÃO é forçado → retorna erro 400 com detalhes
4. Se tem vínculos e É forçado → transaction que limpa tudo
5. Se não tem vínculos → deleta direto

---

### 3. EXCLUSÃO FORÇADA - FRONTEND

**Arquivo:** `src/app/(admin)/admin/beneficios/[id]/page.tsx`

**Mudanças:**

```typescript
const handleDelete = async () => {
  setDeleting(true)
  try {
    // ✨ Primeira tentativa sem forçar
    let response = await fetch(`/api/admin/benefits/${id}`, {
      method: 'DELETE',
    })

    // ✨ Se bloqueado por vínculos, perguntar se quer forçar
    if (response.status === 400) {
      const data = await response.json()
      
      if (data.details && (data.details.planBenefits > 0 || data.details.benefitAccess > 0)) {
        const confirmForce = window.confirm(
          `Este benefício está vinculado a ${data.details.planBenefits || 0} plano(s) e ${data.details.benefitAccess || 0} parceiro(s).\n\nDeseja excluir mesmo assim? Os vínculos serão removidos.`
        )
        
        if (confirmForce) {
          // ✨ Tentar novamente com force=true
          response = await fetch(`/api/admin/benefits/${id}?force=true`, {
            method: 'DELETE',
          })
        } else {
          setDeleting(false)
          setDeleteDialogOpen(false)
          return
        }
      }
    }

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Erro ao excluir benefício')
    }

    toast.success('Benefício excluído com sucesso!')
    router.push('/admin/beneficios')
  } catch (error) {
    console.error('Erro ao excluir benefício:', error)
    toast.error(error instanceof Error ? error.message : 'Erro ao excluir benefício')
  } finally {
    setDeleting(false)
    setDeleteDialogOpen(false)
  }
}
```

**Fluxo UX:**

1. Admin clica "Excluir"
2. Sistema tenta excluir sem forçar
3. Se bloqueado → mostra `window.confirm` com detalhes dos vínculos
4. Se confirmar → nova request com `?force=true`
5. Se negar → cancela operação

---

### 4. EXCLUSÃO BULK FORÇADA

**Arquivo:** `src/app/api/admin/benefits/bulk/route.ts`

**Mudanças:**

```typescript
case 'delete':
  // ✨ Verificar se força exclusão
  const force = body.force === true
  
  if (force) {
    // ✨ Deletar vínculos primeiro, depois benefícios
    await prisma.$transaction([
      prisma.planBenefit.deleteMany({ where: { benefitId: { in: ids } } }),
      prisma.benefitAccess.deleteMany({ where: { benefitId: { in: ids } } }),
      prisma.benefit.deleteMany({ where: { id: { in: ids } } }),
    ])
    result = { count: ids.length }
    message = `${ids.length} benefício(s) excluído(s) com vínculos removidos`
  } else {
    // Verificar vínculos
    const benefitsWithRelations = await prisma.benefit.findMany({
      where: { id: { in: ids } },
      include: {
        _count: {
          select: {
            planBenefits: true,
            benefitAccess: true,
          },
        },
      },
    })

    const benefitsInUse = benefitsWithRelations.filter(
      b => b._count.planBenefits > 0 || b._count.benefitAccess > 0
    )

    if (benefitsInUse.length > 0) {
      const names = benefitsInUse.map(b => b.name).join(', ')
      return NextResponse.json({
        error: `Não é possível excluir. Os benefícios "${names}" estão vinculados a planos ou parceiros.`,
        canForce: true, // ✨ NOVO: indica que pode forçar
        benefitsInUse: benefitsInUse.map(b => ({
          id: b.id,
          name: b.name,
          planBenefits: b._count.planBenefits,
          benefitAccess: b._count.benefitAccess,
        })),
      }, { status: 400 })
    }

    result = await prisma.benefit.deleteMany({
      where: { id: { in: ids } },
    })
    message = `${result.count} benefício(s) excluído(s)`
  }
  break
```

**Detalhes:**

- Mesma lógica do individual, mas para múltiplos IDs
- Retorna `canForce: true` no erro para UI poder oferecer opção
- Transaction garante atomicidade (tudo ou nada)

---

## 🎨 IMPACTO NO USUÁRIO

### ANTES

```
╔════════════════════════════════════════╗
║ Listagem de Benefícios                 ║
╠════════════════════════════════════════╣
║ ❌ Desconto Especial | undefined%       ║ ← Benefício antigo
║ ✅ Cashback Premium  | 10%              ║
║ ❌ Pontos Extras     | undefinedx       ║ ← Benefício antigo
╚════════════════════════════════════════╝

[Excluir] → ❌ "Benefício vinculado a planos"
           → Sem opção de forçar
           → Admin fica preso
```

### DEPOIS

```
╔════════════════════════════════════════╗
║ Listagem de Benefícios                 ║
╠════════════════════════════════════════╣
║ ✅ Desconto Especial | 15%              ║ ← Formato antigo OK
║ ✅ Cashback Premium  | 10%              ║
║ ✅ Pontos Extras     | 500 pts/mês      ║ ← Formato antigo OK
║ ✅ Desconto Novo     | R$ 25            ║ ← Formato novo OK
╚════════════════════════════════════════╝

[Excluir] → ⚠️  "Vinculado a 2 planos e 3 parceiros.
              Deseja excluir mesmo assim? 
              Os vínculos serão removidos."
           → [Sim] → ✅ Deleta tudo em transaction
           → [Não] → Cancela
```

---

## 🔍 VALIDAÇÕES

### Testes Manuais Sugeridos

1. **Listagem com formatos antigos:**
   - Criar benefício DESCONTO com `{percentage: 20}`
   - Criar benefício PONTOS com `{monthlyPoints: 1000}`
   - Verificar se lista mostra "20%" e "1000 pts/mês"

2. **Listagem com formatos novos:**
   - Criar DESCONTO com `{type: 'percentage', value: 15}`
   - Criar PONTOS com `{multiplier: 2}`
   - Verificar se lista mostra "15%" e "2x pontos"

3. **Exclusão sem vínculos:**
   - Benefício órfão → deleta direto

4. **Exclusão com vínculos:**
   - Benefício vinculado → mostra confirm
   - [Não] → cancela
   - [Sim] → deleta + vínculos

5. **Bulk deletion:**
   - Selecionar múltiplos com vínculos
   - Verificar se API oferece `canForce: true`
   - (Frontend bulk ainda não implementado, mas API pronta)

---

## 📊 ARQUIVOS MODIFICADOS

```
✏️  src/app/(admin)/admin/beneficios/page.tsx
   - formatValue() retrocompatível

✏️  src/app/api/admin/benefits/[id]/route.ts
   - DELETE com ?force=true
   - Verifica planBenefits + benefitAccess
   - Transaction para deletar vínculos

✏️  src/app/(admin)/admin/beneficios/[id]/page.tsx
   - handleDelete() com confirm de força
   - Retry com ?force=true

✏️  src/app/api/admin/benefits/bulk/route.ts
   - case 'delete' com force
   - canForce: true no erro
   - Transaction para múltiplos IDs

📄 docs/step-by-step/2026-02-12-fix-listing-undefined-forced-deletion.md
   - Esta documentação
```

---

## 🚀 MELHORIAS FUTURAS

### 1. MIGRAÇÃO DE DADOS
```typescript
// Script para normalizar benefícios antigos
async function migrateBenefitValues() {
  const oldBenefits = await prisma.benefit.findMany()
  
  for (const benefit of oldBenefits) {
    const value = benefit.value as any
    
    if (benefit.type === 'DESCONTO' && value.percentage && !value.type) {
      await prisma.benefit.update({
        where: { id: benefit.id },
        data: {
          value: {
            type: 'percentage',
            value: value.percentage
          }
        }
      })
    }
    
    if (benefit.type === 'PONTOS' && value.monthlyPoints && !value.multiplier) {
      await prisma.benefit.update({
        where: { id: benefit.id },
        data: {
          value: {
            multiplier: 1 // ou calcular baseado em monthlyPoints
          }
        }
      })
    }
  }
}
```

### 2. UI PARA BULK DELETE FORÇADO
```typescript
// Em src/app/(admin)/admin/beneficios/page.tsx
const handleBulkDelete = async () => {
  try {
    let response = await fetch('/api/admin/benefits/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', ids: selected })
    })
    
    if (response.status === 400) {
      const data = await response.json()
      if (data.canForce) {
        const confirmForce = window.confirm(
          `${data.benefitsInUse.length} benefícios têm vínculos.\nForçar exclusão?`
        )
        if (confirmForce) {
          response = await fetch('/api/admin/benefits/bulk', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', ids: selected, force: true })
          })
        }
      }
    }
    
    // ... resto do fluxo
  } catch (error) {
    // ...
  }
}
```

### 3. AUDIT LOG COMPLETO
```typescript
// Registrar quem forçou exclusão e o que foi deletado
await prisma.systemLog.create({
  data: {
    level: 'WARN',
    action: 'FORCE_DELETE_BENEFIT',
    userId: session.user.id,
    details: {
      benefitId: id,
      benefitName: benefit.name,
      deletedPlanBenefits: benefit._count.planBenefits,
      deletedBenefitAccess: benefit._count.benefitAccess,
      forced: true,
      timestamp: new Date().toISOString()
    }
  }
})
```

### 4. SOFT DELETE
```prisma
model Benefit {
  // ... campos existentes
  deletedAt DateTime?
  deletedBy String?
}
```
```typescript
// Soft delete em vez de hard delete
await prisma.benefit.update({
  where: { id },
  data: {
    deletedAt: new Date(),
    deletedBy: session.user.id,
    isActive: false
  }
})
```

---

## 📝 RESUMO

### Problemas Resolvidos
✅ Listagem não mostra mais "undefined%"  
✅ Suporta formatos antigos e novos simultaneamente  
✅ Admin pode forçar exclusão removendo vínculos  
✅ Bulk API pronta para force (UI pendente)  
✅ Transaction garante integridade (tudo ou nada)  

### Segurança
✅ Requer confirmação explícita para forçar  
✅ Mostra quantos vínculos serão removidos  
✅ Transaction evita estado inconsistente  
✅ Fallback seguro para formatos desconhecidos  

### Retrocompatibilidade
✅ Formatos antigos continuam funcionando  
✅ Não quebra benefícios existentes  
✅ Migração pode ser feita gradualmente  

---

**Desenvolvedor:** Codex  
**Revisão:** Pendente  
**Deploy:** Pendente em `dev` branch
