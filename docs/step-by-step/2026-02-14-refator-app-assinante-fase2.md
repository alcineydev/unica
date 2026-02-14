# Refatoração App Assinante - Fase 2: Home + Carteira + QuickActions

**Data:** 2026-02-14  
**Tipo:** Refatoração / UI

---

## Contexto

Fase 2 do redesign do app assinante, focando na Home, Carteira e QuickActions.
Problemas identificados no diagnóstico:
1. Classes `dark:` no badge de cashback da Home
2. QuickActions com 4 rotas inexistentes (`/app/meu-qrcode`, `/app/beneficios`, `/app/ajuda`, `/app/termos`)
3. Imports mortos na Carteira (`Tabs`, `CreditCard`, `formatCPF`, `useSession`)
4. Cores genéricas (`primary`, `muted-foreground`) em vez de cores explícitas
5. Cartão digital usava `zinc` em vez da identidade azul/navy

---

## Arquivos Alterados

### 1. `src/components/app/home/quick-actions.tsx` — REESCRITO
- **Antes:** 6 ações com rotas inexistentes, ícones genéricos
- **Depois:** 4 ações com rotas válidas (carteira, parceiros, avaliações, perfil)
- **Visual:** Cards brancos com borda, ícones coloridos por tipo (azul, verde, amber, violet)
- **Grid:** 6 colunas → 4 colunas

### 2. `src/app/(app)/app/page.tsx` — REESCRITO (327 → ~280 linhas)
- **Removido:** Todas as classes `dark:` (cashback badge, etc.)
- **Novo:** Mini card de plano ativo (border-blue-100, bolinha verde "Ativo")
- **Cashback:** Card branco com borda em vez de bg-green-50
- **Sem plano:** Botão azul explícito, planos linkam para `/checkout/` público (não `/app/planos`)
- **Planos grátis:** Filtrados (`.filter(p => Number(p.price) > 0)`)
- **Cores:** Todas explícitas (gray-900, gray-400, blue-600, green-600)
- **Seção renomeada:** "Minha Conta" → "Acesso Rápido"

### 3. `src/app/(app)/app/carteira/page.tsx` — REESCRITO (422 → ~330 linhas)
- **Removidos imports mortos:** `useSession`, `Tabs/TabsContent/TabsList/TabsTrigger`, `CreditCard`, `Card/CardContent/CardHeader/CardTitle`
- **Removida função morta:** `formatCPF` (nunca utilizada)
- **Cartão digital:** Gradient `zinc-900/800` → navy `#0f172a/#1e293b` com decoração azul
- **Logo:** "U" com `text-blue-600` (identidade)
- **Saldo:** Cards brancos com borda em vez de `Card` genérico
- **Transações:** Card branco com dividers em vez de `Card/CardHeader/CardContent`
- **Ações:** Botões como `<button>` simples em vez de `<Button variant="outline">`
- **Helpers:** Extraídos para fora do componente (melhora performance)
- **Cores:** Todas explícitas, sem `primary`, `muted-foreground`, ou `dark:`

---

## Validação
- TypeScript: `tsc --noEmit` → 0 erros
- Lint: 0 erros nos arquivos alterados

---

## Observações
- Os helpers (`formatCurrency`, `maskCPF`, etc.) foram extraídos para fora do componente, evitando re-criação a cada render
- O mini card de plano ativo na Home é uma adição que dá contexto imediato ao assinante
- A seção "Acesso Rápido" agora tem apenas 4 ações para rotas que realmente existem
- O background `#0f172a` do cartão digital é o `slate-950` do Tailwind, consistente com a identidade escura
