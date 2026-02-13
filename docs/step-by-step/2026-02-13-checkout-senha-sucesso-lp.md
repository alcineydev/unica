# Checkout com Senha + Sucesso Premium + LP Fixes

**Data:** 2026-02-13
**Branch:** dev

---

## Resumo

Adição de campos de senha no checkout público, reescrita da página de sucesso com polling real,
fix nos redirects, e ajustes na LP de planos e login.

---

## Alterações

### 1. Login - Link "Seja um Assinante" → /planos
- **Arquivo:** `src/app/(auth)/login/page.tsx`
- **Antes:** Link apontava para `/cadastro`
- **Depois:** Link aponta para `/planos` (LP pública de planos)

### 2. LP Planos - Todos os planos → checkout
- **Arquivo:** `src/app/(public)/planos/page.tsx`
- Removido "Criar Conta Grátis" do CTA final → substituído por "Já tenho conta" → /login
- Plano grátis: botão agora diz "Assinar Grátis" (não "Começar Grátis")
- Plano grátis: link agora vai para `/checkout/[slug]` (não `/cadastro`)
- Removido import não usado de Card/CardContent

### 3. Checkout Personal Form - Campos de Senha
- **Arquivo:** `src/app/(public)/checkout/[planId]/components/checkout-personal-form.tsx` (REESCRITO)
- **Novos campos:** senha + confirmação de senha (com show/hide toggle)
- **Indicador de força:** Muito curta / Fraca / Média / Forte
- **Validação:** senhas coincidem + mínimo 6 caracteres
- **Condição:** campos de senha SÓ aparecem se o email NÃO tem conta existente
- **Email existente com plano ativo:** Alert amber com link para login, bloqueia continuar
- **Email existente sem plano:** Alert verde, dados preenchidos, sem campos de senha

### 4. Checkout Page - State + Payload
- **Arquivo:** `src/app/(public)/checkout/[planId]/page.tsx`
- `personalData` agora inclui `password` e `confirmPassword`
- `payload.customer.password` enviado na request
- Redirects com `&method=PIX|CREDIT_CARD` para a página de sucesso
- Removida prop `onAddressFound` (não existe mais no novo form)

### 5. API Checkout Asaas - Senha + Datas de Ciclo
- **Arquivo:** `src/app/api/checkout/asaas/route.ts`
- Interface `CheckoutRequest.customer` agora aceita `password?: string`
- Criação do user usa `customer.password || 'Unica@2025'` (hash bcrypt)
- Calcula `planStartDate` e `planEndDate` baseado em `plan.period`
  - MONTHLY: +1 mês
  - YEARLY: +1 ano
  - SINGLE: +99 anos
- Email de boas-vindas enviado após criação do assinante

### 6. API Checkout Lookup - Retorna exists + hasActivePlan
- **Arquivo:** `src/app/api/checkout/asaas/lookup/route.ts` (REESCRITO)
- Agora retorna: `exists`, `hasActivePlan`, `planName`, `found`, `data`
- Verifica `subscriptionStatus === 'ACTIVE'` para plano ativo
- Inclui `plan.name` no response

### 7. Página de Sucesso com Polling Real
- **Arquivo:** `src/app/(public)/checkout/sucesso/page.tsx` (REESCRITO)
- **PIX/Cartão:** Polling automático a cada 5s com progress bar + timer
- **PIX/Cartão confirmado:** Confetti + redirect automático para /login?redirect=/app/perfil (3s)
- **Boleto:** Sem polling, mostra código de barras + copiar + baixar PDF + orientações
- **Estados visuais:** gradiente verde (confirmado), amber (boleto), violet (aguardando)
- **Parâmetro `method`:** Distingue PIX, CREDIT_CARD e BOLETO

### 8. PIX Result - Fix Redirect
- **Arquivo:** `src/app/(public)/checkout/[planId]/components/checkout-pix-result.tsx`
- Redirect: `/login?redirect=/app/perfil` (antes: `/login?redirect=/app`)
- Texto: "Acessar Meu Perfil" (antes: "Acessar Minha Conta")

---

## Fluxo Completo

1. `/planos` → Escolhe plano → `/checkout/[slug]`
2. Step 1 (Dados): email, nome, CPF, telefone, **senha** (se novo)
3. Step 2 (Endereço): CEP, rua, número, bairro, cidade, UF
4. Step 3 (Pagamento): PIX, Cartão ou Boleto
5. Processa → Resultado:
   - PIX: QR Code + polling → sucesso → redirect /app/perfil
   - Cartão: aprovação direta → sucesso → redirect /app/perfil
   - Boleto: código barras + PDF → orientações → login

---

## Checklist

- [x] Login: "Seja um Assinante" → /planos
- [x] LP Planos: sem "Criar Conta Grátis", todos → checkout
- [x] Checkout: campos de senha + confirmação + força
- [x] Checkout: email existente → esconde senha + prefill
- [x] Checkout: email com plano ativo → bloqueia + link login
- [x] API: aceita password, hash bcrypt
- [x] API: define planStartDate + planEndDate
- [x] API Lookup: retorna exists + hasActivePlan + planName
- [x] Email boas-vindas enviado após checkout
- [x] Sucesso PIX/Cartão: polling + progress + confetti + redirect
- [x] Sucesso Boleto: código barras + PDF + orientações (sem polling)
- [x] Redirect pós-confirmação: /login?redirect=/app/perfil
- [x] 0 erros de lint
