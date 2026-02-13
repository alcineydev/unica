# LP Publica de Planos + Home Publica

**Data:** 2026-02-13
**Branch:** dev

---

## Resumo

Criacao de landing page publica de planos e home page institucional.
Fix na API de busca de planos para suportar slug case-insensitive.
Redirect da pagina antiga de planos `(auth)/planos` para a nova LP.

---

## Alteracoes

### 1. Fix API Plans - Busca Robusta
- **Arquivo:** `src/app/api/plans/public/[planId]/route.ts`
- **Antes:** Busca por `{ id: planId }` OR `{ slug: planId }` (case-sensitive)
- **Depois:** Busca em cascata:
  1. ID exato ou slug exato
  2. Slug case-insensitive (`mode: 'insensitive'`)
  3. Nome case-insensitive como fallback
  4. Busca parcial (contains) como ultimo recurso
- **Fix:** `/checkout/basico` agora encontra o plano mesmo se o slug no banco for "Basico" ou "BASICO"

### 2. Home Publica (/)
- **Arquivo:** `src/app/page.tsx`
- **Antes:** `redirect('/login')` - nenhuma LP
- **Depois:** Landing page institucional com:
  - Header sticky com logo UNICA + CTA "Ver Planos"
  - Hero section com titulo, subtitulo e CTAs
  - Secao "Como funciona?" com 4 cards
  - CTA central com gradiente
  - Trust badges (Asaas, PIX, Cartao, Boleto)
  - Footer com links legais
- **Server Component** (sem 'use client') para SEO

### 3. LP de Planos (/planos)
- **Arquivo:** `src/app/(public)/planos/page.tsx` (NOVO)
- **API usada:** `GET /api/plans/public` (lista todos os planos ativos)
- **Funcionalidades:**
  - Header com logo e navegacao
  - Hero com badge e titulo
  - Grid de planos (1-3 colunas responsivo)
  - Badge "Mais Popular" no segundo plano
  - Preco formatado com periodo
  - Features + Benefits listados
  - CTA diferente: "Criar Conta Gratis" (preco=0) vs "Assinar Plano" (pago)
  - Planos gratuitos -> `/cadastro?plano=id`
  - Planos pagos -> `/checkout/slug` (Asaas)
  - Trust badges (Asaas, nao Mercado Pago)
  - FAQ resumido (3 perguntas)
  - CTA final + footer

### 4. Redirect (auth)/planos
- **Arquivo:** `src/app/(auth)/planos/page.tsx`
- **Antes:** Pagina completa com cards (chamava `/api/public/plans`, mencionava "Mercado Pago")
- **Depois:** `redirect('/planos')` - redireciona para a nova LP publica

---

## Rotas Publicas

O middleware ja permite `/planos` e `/checkout` como rotas publicas (definido em `auth.config.ts` linhas 19-20).

Fluxo completo do visitante:
1. `/` - Home institucional
2. `/planos` - LP de planos com precos e beneficios
3. `/checkout/[slug]` - Checkout Asaas (PIX/Cartao/Boleto)
4. `/checkout/sucesso` - Confirmacao de pagamento
5. `/login` - Login para acessar o app

---

## Checklist

- [x] API busca slug case-insensitive + fallback por nome
- [x] Home publica com hero + CTA (Server Component, SEO-friendly)
- [x] LP de planos publica em `/planos` com cards premium
- [x] Planos gratuitos direcionam para `/cadastro`
- [x] Planos pagos direcionam para `/checkout/[slug]`
- [x] Referencia "Mercado Pago" removida (agora "Asaas")
- [x] `(auth)/planos` redireciona para `/planos`
- [x] 0 erros de lint
