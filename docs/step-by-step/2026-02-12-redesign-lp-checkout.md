# REDESIGN PROFISSIONAL - LP Planos + Checkout Completo

**Data:** 2026-02-12
**Tipo:** Redesign Visual Completo

---

## Contexto

A LP de planos e o checkout tinham visual genérico, sem impacto. O redesign traz:
- Hero com gradiente escuro azul (não fundo branco)
- Cards com glow border no destaque e preço em box colorido
- Checkout com branding UNICA, stepper profissional, plan summary completo
- Botão "Pagar Agora" em azul (não roxo/violet)
- Fundo consistente #f8fafc em todas as telas públicas

---

## Alterações Realizadas

### 1. LP Planos (`src/app/(public)/planos/page.tsx`)
**Ação:** REESCRITO COMPLETAMENTE

- Hero: gradiente escuro `from-blue-600 via-blue-700 to-blue-800` com pattern SVG
- Cards: glow border azul no destaque, preço dentro de box `bg-blue-50`
- Badges "Mais Popular" com estrelas douradas
- Seção "Como funciona": ícones rotacionados com badges numéricas azuis
- Vantagens: layout horizontal (ícone + texto lado a lado)
- FAQ: cards minimalistas
- CTA final: dark (gray-900) com glow azul sutil
- Footer: minimalista
- Sem "Cadastre-se", sem "grátis", sem link /cadastro

### 2. Plan Summary (`src/app/(public)/checkout/[planId]/components/checkout-plan-summary.tsx`)
**Ação:** REESCRITO COMPLETAMENTE

- Header dark com gradiente `from-gray-900 to-gray-800`
- Logo Crown + nome do plano + "UNICA Clube de Benefícios"
- Bloco de preço separado com label "Total"
- Lista de features com checks verdes
- Footer com badges de segurança (Shield + Lock)
- Sticky `top-24` para acompanhar scroll

### 3. Stepper (`src/app/(public)/checkout/[planId]/components/checkout-stepper.tsx`)
**Ação:** REESCRITO COMPLETAMENTE

- 3 etapas: Dados (User) → Endereço (MapPin) → Pagamento (CreditCard)
- Estado completado: verde com check
- Estado ativo: azul com ring-4 ring-blue-100
- Estado futuro: cinza
- Conectores: verde se completado, cinza se pendente
- Labels com cor por estado
- Animações de transição

### 4. Checkout Page (`src/app/(public)/checkout/[planId]/page.tsx`)
**Ação:** AJUSTADO

- Fundo: `bg-[#f8fafc]` em todas as views (loading, erro, PIX, boleto, form)
- Header: sticky com logo UNICA + botão "Voltar"/"Ver planos"
- Grid: `lg:grid-cols-[1fr_380px]` (sidebar mais larga)
- Removido header antigo genérico

### 5. Botão "Pagar Agora" (`checkout-payment-form.tsx`)
**Ação:** AJUSTADO

- Classe: `bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 rounded-xl shadow-md shadow-blue-200/40`
- Cor azul explícita (não depende de `bg-primary` que poderia ser roxo)

---

## Arquivos Alterados

| Arquivo | Ação | Linhas |
|---------|------|--------|
| `src/app/(public)/planos/page.tsx` | REESCRITO | ~400 |
| `src/app/(public)/checkout/[planId]/components/checkout-plan-summary.tsx` | REESCRITO | ~88 |
| `src/app/(public)/checkout/[planId]/components/checkout-stepper.tsx` | REESCRITO | ~55 |
| `src/app/(public)/checkout/[planId]/page.tsx` | AJUSTADO | ~342 |
| `src/app/(public)/checkout/[planId]/components/checkout-payment-form.tsx` | AJUSTADO | 1 linha |

---

## Checklist

- [x] LP: Hero com background gradiente escuro azul
- [x] LP: Cards com glow border no destaque, preço em box colorido
- [x] LP: Números dos passos em badges circulares azuis
- [x] LP: CTA final em dark (gray-900)
- [x] LP: Sem "Cadastre-se" nem "grátis"
- [x] Checkout: Plan summary completo (nome, desc, features, preço, segurança)
- [x] Checkout: Stepper com ícones, cores por estado, conectores
- [x] Checkout: Botão "Pagar Agora" em azul
- [x] Checkout: Fundo #f8fafc
- [x] Checkout: Header com branding UNICA
- [x] Zero erros de lint
