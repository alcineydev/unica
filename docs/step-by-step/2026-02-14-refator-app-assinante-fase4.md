# Refatoração App Assinante - Fase 4: Polish Visual

**Data:** 2026-02-14
**Escopo:** Redesign completo de 3 páginas + ajuste no perfil

## Objetivo
Polish visual para todas as páginas combinarem com o design "banking app" da carteira (Fase 2). Hero dark, cards brancos com border sutil, ícones coloridos, tipografia refinada.

## Arquivos Alterados

### 1. `src/app/(app)/app/parceiros/[id]/page.tsx` — REESCRITO
**Antes:** Cards genéricos do shadcn, gradients com cores de tema, banner simples
**Depois:**
- Hero dark overlay (`from-[#0f172a]`) sobre o banner, com logo e nome sobrepostos
- Fallback sem banner: gradient dark com blobs decorativos (estilo carteira)
- Botão voltar: círculo com backdrop-blur
- Benefícios: cards brancos com barra colorida lateral (verde, âmbar, azul, violeta)
- Helper `getBenefitConfig()` unifica icon/color/bg/text por tipo
- Contato/Localização: seções com header separado por border-b sutil
- Instagram/Facebook: backgrounds soft gradient
- Galeria: grid com ring-1 sutil
- WhatsApp fixo: `from-[#f8fafc]` (corrige o antigo `from-background`), shadow verde
- Modal imagem: botão fechar com bg-white/10
- Removido: Card/CardContent do shadcn (seções manuais mais leves)

### 2. `src/app/(app)/app/notificacoes/page.tsx` — REESCRITO
**Antes:** Card do shadcn para cada notificação, Badge "Nova" grande, Button outline
**Depois:**
- ICON_MAP constante fora do componente (performance)
- formatDate helper fora do componente
- Ícones coloridos por tipo em caixas arredondadas (amber, green, violet, blue)
- Bolinha azul (2px) ao invés de Badge "Nova" (mais sutil)
- Botão "Marcar todas" em text-blue com hover:bg-blue-50 (não Button outline)
- Empty state com box arredondado para ícone
- Cards de notificação como `<button>` (semântica correta)
- Não-lida: bg-blue-50/60 + border-blue-100
- Lida: bg-white + opacity-75
- Removido: import Badge (não usado)

### 3. `src/app/(app)/app/buscar/page.tsx` — REESCRITO
**Antes:** Tags em bg-gray-100, categorias sem imagem, layout com header sticky
**Depois:**
- Tags populares: bg-white + border-gray-200, hover muda para bg-blue-600 + text-white
- Active:scale-95 para feedback tátil
- Categorias com imagem do banner (fallback: ícone Search em bg-blue-50)
- Hover em categorias: border-blue-200 + shadow-sm
- Ícone Sparkles para seção "Explorar por categoria"
- Link "Ver todos os parceiros →" com seta
- Removido: header sticky separado (integrado ao fluxo)
- Importa next/image para banners de categoria

### 4. `src/app/(app)/app/perfil/page.tsx` — AJUSTADO
- Botão salvar: `bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-200/40`
- Fundo do fixo: `bg-[#f8fafc]/95` + `border-gray-200`
- Card info da conta: `border-gray-100` explícito

## Verificação
- **Zero** `dark:` em `src/app/(app)/`
- **Zero** `from-background`, `via-background`, `to-background`, `bg-background`
- **Zero** `text-muted-foreground`, `bg-primary`, `text-primary`, `bg-muted`
- **Zero** erros lint/TypeScript
- **Zero** imports não utilizados

## Design System Consistente
Todas as páginas do app agora seguem:
- Fundo: `bg-[#f8fafc]` ou branco
- Cards: `bg-white border border-gray-100 rounded-xl`
- Texto principal: `text-gray-900`
- Texto secundário: `text-gray-500` ou `text-gray-400`
- Accent: `text-blue-600`, `bg-blue-50`, `bg-blue-600`
- Shadows: `shadow-sm` para cards, `shadow-md shadow-{color}-200/40` para botões
- Corners: `rounded-xl` padrão
- Hero sections: gradient dark navy com blobs decorativos
