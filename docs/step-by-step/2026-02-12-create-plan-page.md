# 🔧 CRIAR PÁGINA /admin/planos/novo

**Data:** 12/02/2026  
**Tipo:** Feature (Nova Página)  
**Módulo:** Admin - Planos  
**Status:** Implementado

---

## CONTEXTO

### Problema

O botão "Novo Plano" na listagem de planos (`/admin/planos`) apontava para `?action=create`, mas a página não tratava esse query param. A página `/planos/novo` existia mas era apenas um redirect inútil de volta para a listagem. Resultado: clicar em "Novo Plano" não fazia nada.

### Causa Raiz

A intenção original era usar um modal (via query param `action=create`), mas o modal nunca foi implementado. A página de edição (`/planos/[id]`) já era uma página completa e separada, então era inconsistente ter a criação via modal.

---

## SOLUÇÃO

### Página Criada: `/admin/planos/novo/page.tsx`

Formulário completo de criação de plano, baseado na estrutura da página de edição existente.

**Estrutura:**

```
Layout 3 colunas (lg)
├── Coluna Principal (2/3)
│   ├── Card: Informações do Plano (nome, slug, descrição)
│   ├── Card: Preços (mensal, anual, único + preview)
│   ├── PlanBenefitsSelector (componente reutilizado)
│   └── Card: Lista de Recursos (features textarea)
└── Sidebar (1/3)
    ├── Card: Configurações (switch ativo/inativo)
    └── Card: Resumo (preview dinâmico)
```

**Funcionalidades:**

1. **Nome + Slug automático:** Ao digitar o nome, slug é gerado automaticamente
2. **3 Preços:** Mensal (obrigatório), Anual e Único (opcionais)
3. **Preview de Preços:** Mostra valores formatados em tempo real
4. **Economia anual:** Calcula e exibe economia quando preço anual é informado
5. **Selector de Benefícios:** Reutiliza `PlanBenefitsSelector` (busca, selecionar todos)
6. **Features:** Textarea para bullets de marketing (checkout)
7. **Toggle ativo/inativo:** Switch do shadcn/ui
8. **Resumo lateral:** Card com dados preenchidos em tempo real
9. **Validações client-side:** Nome, descrição (mín. 10), preço > 0, mín. 1 benefício
10. **Erros de API detalhados:** Mostra primeiro erro de validação Zod se disponível
11. **Responsivo:** Botão "Criar" duplicado (header + mobile bottom)

---

### Correção do Botão na Listagem

**Arquivo:** `src/app/(admin)/admin/planos/page.tsx`

```tsx
// ANTES:
<Link href="/admin/planos?action=create">

// DEPOIS:
<Link href="/admin/planos/novo">
```

---

## INTEGRAÇÃO COM API

### POST `/api/admin/plans`

**Body enviado:**
```json
{
  "name": "Plano Premium",
  "slug": "plano-premium",
  "description": "Acesso completo a todos os benefícios",
  "price": 29.90,
  "priceYearly": 299.00,
  "priceSingle": null,
  "isActive": true,
  "benefitIds": ["cuid1", "cuid2"]
}
```

**Validação (Zod):**
- `name`: min 2, max 50
- `description`: min 10, max 300
- `price`: min 0, max 9999.99
- `benefitIds`: array com mín. 1 item

**Tratamento de erros:**
- Se API retorna `details` (Zod errors) → mostra primeiro erro
- Se API retorna `error` → mostra mensagem
- Fallback genérico para erros inesperados

---

## COMPONENTES REUTILIZADOS

| Componente | Arquivo | Uso |
|------------|---------|-----|
| `PlanBenefitsSelector` | `src/components/admin/plan-benefits-selector.tsx` | Selector de benefícios com busca e selecionar todos |
| `Switch` | `@/components/ui/switch` | Toggle ativo/inativo (shadcn/ui) |
| `Card`, `Input`, `Label`, `Textarea`, `Button` | `@/components/ui/*` | Componentes base shadcn/ui |

---

## ARQUIVOS MODIFICADOS

```
✏️  src/app/(admin)/admin/planos/novo/page.tsx (REESCRITO)
   └─ Formulário completo substituindo redirect

✏️  src/app/(admin)/admin/planos/page.tsx
   └─ href do botão: ?action=create → /novo

📄 docs/step-by-step/2026-02-12-create-plan-page.md
   └─ Esta documentação
```

---

## TESTES SUGERIDOS

1. **Criar plano básico:** nome + descrição + preço + 1 benefício
2. **Validações:** tentar criar sem nome, sem preço, sem benefícios
3. **Slug automático:** digitar "Plano Premium" → verificar slug "plano-premium"
4. **Preview de preços:** preencher 3 preços e verificar preview
5. **Economia anual:** preencher mensal R$30 + anual R$300 → economia R$60
6. **Responsivo:** testar em mobile (botão bottom aparece)
7. **Cancelar:** botão cancelar volta para listagem
8. **Após criar:** redireciona para listagem com toast de sucesso

---

## MELHORIAS FUTURAS

1. **Upload de imagem/banner do plano**
2. **Ordenação de features via drag-and-drop**
3. **Preview de checkout em tempo real**
4. **Duplicar plano existente (pré-preencher formulário)**
5. **Validação de slug único em tempo real (debounce)**
