# FASE 5: Layout Premium Desktop + Mobile Hero Full + Grid + Upgrade

**Data:** 2026-02-14

## Problemas Resolvidos

1. **Desktop**: Sidebar genérica branca, corpo centralizado `max-w-4xl` = muito vazio
2. **Mobile**: Header branco ocupava espaço, hero deveria começar do topo
3. **Parceiros no mobile**: Listagem vertical, deveria ser 3 colunas compactas
4. **Upgrade**: Links iam para `/checkout/` público, corrigido para `/app/planos`

## Arquivos Alterados

### 1. `src/components/app/app-sidebar.tsx` — REESCRITO
- **Função:** Sidebar de navegação desktop (visível apenas em `lg:`)
- **Mudanças:**
  - Gradient dark navy (`from-[#0a1628] via-[#0d1b36] to-[#0a1628]`)
  - Decoração com blobs blur
  - Logo UNICA com badge gradiente azul
  - Perfil mini com avatar, nome e badge Crown "Assinante"
  - Navegação com indicador ativo (barra azul lateral)
  - Card "Upgrade" com link para `/app/planos`
  - Botão "Sair" com hover vermelho
  - `sticky top-0 h-screen`

### 2. `src/components/app/app-header.tsx` — AJUSTADO
- **Função:** Header global do app
- **Mudança:** Adicionado `hidden lg:block` para esconder no mobile
- O `NotificationModal` continua renderizando fora do `<header>` (sempre visível)

### 3. `src/app/(app)/layout.tsx` — REESCRITO
- **Função:** Layout principal do app assinante
- **Mudanças:**
  - `max-w-4xl` → `max-w-6xl` (conteúdo mais largo no desktop)
  - Sidebar `h-screen sticky top-0`
  - Mobile: sem padding top extra (hero começa colado)
  - `pb-20 lg:pb-6` para bottom nav mobile

### 4. `src/app/(app)/app/page.tsx` — AJUSTADO (3 mudanças)
- **Função:** Home principal do assinante

#### 4a. Hero Mobile Mini Header
- Logo UNICA + ícone Bell (notificações) + avatar dentro do hero dark
- Classe `lg:hidden` (só mobile)
- Avatar na saudação agora é `hidden lg:flex` (só desktop)

#### 4b. Grid Parceiros Responsivo
- **Mobile (`lg:hidden`):** Grid 3 colunas com cards compactos (logo, nome, cidade, badge)
- **Desktop (`hidden lg:block`):** Lista detalhada com chevron (mantida)
- Mobile mostra 9 parceiros, desktop mostra 8

#### 4c. Fix Links Upgrade
- Seção "sem plano ativo": `/checkout/${slug}` → `/app/planos`
- Seção "upgrade de plano": `/checkout/${slug}` → `/app/planos`
- Resultado: 0 referências a `/checkout/` no arquivo

### 5. `src/app/(app)/app/planos/page.tsx` — REESCRITO
- **Função:** Página de planos para o assinante (dentro do app)
- **Mudanças:**
  - Card dark do plano atual com Crown, preço, shield "Assinatura ativa", badges de benefícios
  - Lista de outros planos com CTA contextual (Upgrade/Trocar/Assinar)
  - Badge "Mais Popular" no primeiro plano quando sem assinatura
  - Features e benefícios listados por plano
  - CTA vai para `/checkout/${slug}` (checkout real para pagamento)
  - Estado de loading com spinner centralizado

## Verificações Realizadas
- `grep "hidden lg:block" app-header.tsx` → 1 match ✅
- `grep "from-[#0a1628]" app-sidebar.tsx` → 1 match ✅
- `grep "max-w-6xl" layout.tsx` → 1 match ✅
- `grep "checkout" page.tsx` → 0 resultados ✅
- `grep "Bell" page.tsx` → encontrado ✅
- Lint: 0 erros introduzidos ✅
- Fix: `<img>` → `<Image>` na sidebar
- Fix: inline style → `rounded-b-[20px]` Tailwind na home
