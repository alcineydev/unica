# Refatoração App Assinante - Fase 2: Home + Carteira Banking + QuickActions

**Data:** 2026-02-14  
**Tipo:** Refatoração / UI / Redesign

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

### 3. `src/app/(app)/app/carteira/page.tsx` — REESCRITO: BANKING APP STYLE
- **Removidos imports mortos:** `useSession`, `Tabs`, `CreditCard`, `Card` components
- **Removida função morta:** `formatCPF` (nunca utilizada)
- **Hero Banking Style:** Gradient navy `#0a1628/#0f1f3d` com blobs abstratos
  - Avatar + nome + plano + status no topo
  - Saldo cashback em destaque (32px/36px)
  - Toggle Eye para ocultar/mostrar valores (privacidade)
  - Cards glass-morphism para Pontos e Economia estimada
  - Curva suave na transição hero → conteúdo (`rounded-b-3xl`)
- **Ações rápidas:** Grid 4 colunas (QR Code, Enviar, Baixar, Extrato) com ícones coloridos
- **Sistema de Tabs:**
  - Tab Carteirinha: QR Code com card profissional + dados titular + plano badge
  - Tab Extrato: Resumo do período (total + cashback ganho) + lista transações
- **Código copiável:** Clique no código → copia com ícone Copy
- **Valores privacidade:** Toggle oculta cashback, pontos, economia, transações
- **Acessibilidade:** Botões com `title` atributo (ocultar valores, atualizar)
- **Helpers:** Extraídos para fora do componente
- **Cores:** Todas explícitas, zero `dark:` classes

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
