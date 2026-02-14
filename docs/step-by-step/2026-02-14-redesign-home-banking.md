# Redesign Home - Estilo App Banking

**Data:** 2026-02-14
**Escopo:** API home ajustada + Home page reescrita completa

## Objetivo
Transformar a home em um app estilo banking/fintech (como Amor e Saúde), com hero dark, métricas de saldo, e todas as seções organizadas.

## Arquivos Alterados

### 1. `src/app/api/app/home/route.ts` — AJUSTADO
- **Planos sempre retornados**: Removida condição `if (!temPlanoAtivo)` — agora busca planos independente de status
- **Novo campo `currentPlanId`**: Adicionado no response para o frontend saber qual plano é o atual
- Permite exibir seção de "Upgrade" na home para assinantes ativos

### 2. `src/app/(app)/app/page.tsx` — REESCRITO
**Estrutura da home com plano ativo:**

1. **Hero Dark Banking** (`from-[#0a1628]`)
   - Avatar com inicial do nome
   - Saudação "Olá, {nome}"
   - Badge do plano atual
   - Toggle Eye/EyeOff para privacidade
   - Saldo principal em destaque (cashback)
   - 3 métricas glass-morphism: Pontos, Economia, Carteira (link)

2. **Carrossel de Destaques**
   - Usa componente existente `CarouselDestaques`
   - Parceiros com `isDestaque: true`

3. **Parceiros em Destaque** (scroll horizontal)
   - Cards compactos 140px com logo, nome, categoria, badge desconto
   - Link "Ver todos →"

4. **Categorias** (scroll horizontal)
   - Ícones 56px com banner da categoria
   - Fallback: gradient blue com ícone Store
   - Link "Ver todas →"

5. **Parceiros do Plano** (lista vertical)
   - Filtrados por benefitAccess do plano do assinante
   - Cards com logo, nome, rating estrela, cidade
   - Badges de benefícios (OFF, Cash, pts, Exclusivo)
   - Subtítulo "Empresas com benefícios para o plano X"

6. **Upgrade de Plano** (card dark)
   - Filtra planos com preço maior que o atual
   - Cards glass-morphism com nome, preço, qtd benefícios
   - Link direto para checkout

**Sem plano ativo:**
- Tela centralizada com CTA "Escolha seu Plano"
- Stats visuais (500+ parceiros, 50% desconto, 5% cashback)
- Lista de planos disponíveis com link para checkout

## Verificação
- Zero `dark:`, zero genéricos de tema
- Zero erros lint/TypeScript
- Zero imports não utilizados
- Acessibilidade: `title` no botão Eye/EyeOff
