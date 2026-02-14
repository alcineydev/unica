# FASE 5C: Hero Light + Mobile Header Fix + Padding Global

**Data:** 2026-02-14

## Problemas Resolvidos

1. Desktop: Hero dark + Sidebar dark = massa escura. Hero → LIGHT com cards coloridos
2. Mobile: Header global aparecia (duplicava mini-header do hero)
3. Páginas sem padding no mobile (layout agora px-0 no mobile)

## Arquivos Alterados

### 1. `src/app/(app)/app/page.tsx` — HERO REESCRITO LIGHT
- **Função:** Home principal do assinante
- Hero: `bg-white` com decoração azul sutil (blobs blur)
- Mini-header mobile: logo U azul + bell cinza + avatar azul claro
- Saudação: `text-gray-900` (dark text on light bg)
- Saldo: `text-gray-900 text-[32px]`
- Métricas em cards coloridos:
  - Pontos: amber gradient (`from-amber-50 to-amber-100/50`)
  - Economia: green gradient (`from-green-50 to-green-100/50`)
  - Carteira: blue gradient (`from-blue-50 to-blue-100/50`)
- Transição suave: `bg-gradient-to-b from-white to-[#f8fafc]`
- Margins: removido `-mx-4 -mt-4` mobile (layout px-0 agora)
- Loading skeleton: mesmo ajuste de margins

### 2. `src/components/app/app-header.tsx` — HIDDEN COMPLETO
- `lg:hidden` → `hidden` (escondido em TODAS as telas)
- Desktop: sidebar é navegação (já tinha logo, user, nav, logout)
- Mobile: bottom nav + mini-headers internos nas páginas

### 3. `src/app/(app)/layout.tsx` — REESCRITO SEM HEADER
- Removido import e uso de `AppHeader`
- Mobile: `px-0 py-0` (páginas controlam padding)
- Desktop: `lg:px-8 lg:py-6` mantido
- `lg:max-w-5xl` (max-w só desktop)

### 4-12. Páginas com padding mobile (`px-4 lg:px-0 pt-4 lg:pt-0`)
| Arquivo | Wrapper original | Wrapper atualizado |
|---------|-----------------|-------------------|
| `perfil/page.tsx` | `pb-20 md:pb-6` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `notificacoes/page.tsx` | `pb-24` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `buscar/page.tsx` | `pb-24` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `parceiros/page.tsx` | `pb-24` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `categorias/page.tsx` | `min-h-screen bg-[#f8fafc] pb-24` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `categoria/[slug]/page.tsx` | `min-h-screen bg-[#f8fafc] pb-24` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `planos/page.tsx` | `pb-24` | + `px-4 lg:px-0 pt-4 lg:pt-0` |
| `minhas-avaliacoes/page.tsx` | `p-4 space-y-6` | `p-4 lg:p-0 space-y-6` |
| `avaliar/[parceiroId]/page.tsx` | `p-4 max-w-md mx-auto` | `p-4 lg:p-0 max-w-md mx-auto` |

### Páginas full-width (ajuste de margins negativas)
| Arquivo | Antes | Depois |
|---------|-------|--------|
| `carteira/page.tsx` | `-mx-4 sm:-mx-6 -mt-6` | `lg:-mx-8 lg:-mt-6` |
| `parceiros/[id]/page.tsx` | `-mx-4 sm:-mx-6 -mt-6` | `lg:-mx-8 lg:-mt-6` |

## Verificações
- Header `hidden`: ✅ line 106
- Layout sem `AppHeader`: ✅ 0 referências
- Layout `px-0 py-0`: ✅ presente
- Hero `#0a1628`: ✅ 0 referências (agora light)
- Padding `px-4 lg:px-0` em 7 páginas: ✅ todos confirmados
- Lint introduzidos: ✅ 0
