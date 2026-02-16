# REDESIGN: Home Assinante + Crop Admin — Wireframe v6

**Data:** 2026-02-16

## Resumo

Redesign completo da home do assinante baseado no wireframe v6 aprovado. Inclui mudanças no crop do admin, carousel peek, e cards com logo full.

## Mudanças

| Área | Antes | Depois |
|------|-------|--------|
| Crop destaque (admin) | `banner` (4:1 / 1600×400) | `destaque` (2.5:1 / 1600×640) |
| Carousel destaques | Full-width com setas | **Peek carousel** (mostra próximo) |
| Carousel proporção | `aspect-[4/1]` | `aspect-[2.5/1]` |
| Cards parceiros | Logo 48×48 pequena | **Logo FULL** (aspect-square, preenche topo) |
| Badge dos cards | Embaixo do texto | **Flutuante no canto** da imagem |
| Meta dos cards | Só cidade | **Categoria · Cidade** |
| Seção "Em Destaque" | Carousel + cards separados | **Só peek carousel** |
| Listagem /parceiros | Lista horizontal | **Grid com logo full** |

## Arquivos Alterados

### `src/components/ui/image-upload.tsx`
- Novo ratio `destaque: 2.5` e class `aspect-[2.5/1]`
- Type atualizado: `'square' | 'banner' | 'destaque' | 'video'`

### `src/app/(admin)/admin/parceiros/[id]/editar/page.tsx`
- `bannerDestaque` usa `aspectRatio="destaque"` (2 locais)
- Orientação: "1600×640px (proporção 2.5:1)"

### `src/components/app/home/carousel-destaques.tsx` — REWRITE
- **Peek carousel**: mostra pedacinho do próximo slide
- Swipe nativo com `snap-x snap-mandatory`
- `aspect-[2.5/1]` nos slides
- Overlay com logo + nome + categoria + badge
- Barra de progresso de scroll
- Indicador "Deslize →"

### `src/app/api/app/home/route.ts`
- Destaques agora incluem: `banner`, `category`, `desconto`, `cashback`
- Safety parse em benefit.value dos destaques

### `src/app/(app)/app/page.tsx`
- Interface `Destaque` ampliada com novos campos
- **Removida** seção "Parceiros em Destaque" (cards horizontais)
- Cards parceiros: logo full no topo (`aspect-square` + `object-contain p-3`)
- Badge flutuante colorido no canto (verde/âmbar/azul)
- Meta: Categoria · Cidade com separador visual
- Desktop: `grid-cols-4 xl:grid-cols-5`
- Botão "Ver todos os parceiros →" após grid
- Imports limpos (`Sparkles`, `Building2` removidos)

### `src/app/(app)/app/parceiros/page.tsx`
- Grid mobile 3 colunas com logo full (igual home)
- Grid desktop 4-5 colunas com logo full
- Imports limpos (`Building2`, `Star` removidos)

## Banner parceiro (detalhe)
Mantém `aspect-[4/1]` — banner normal, não destaque.

## Notas
- Imagens de `bannerDestaque` existentes (4:1) serão exibidas em 2.5:1 com `object-cover` — funciona, mas ideal é re-subir
- `scrollbar-hide` já existia no `globals.css`
- Zero erros lint novos

## Checklist
- [x] Novo ratio `destaque: 2.5` no image-upload
- [x] Admin: `bannerDestaque` usa `aspectRatio="destaque"`
- [x] Admin: orientação "1600×640px (2.5:1)"
- [x] Carousel: peek style com swipe nativo
- [x] Carousel: aspect 2.5:1 + overlay + badge
- [x] Carousel: barra de progresso
- [x] Cards: logo FULL no topo (aspect-square)
- [x] Cards: badge flutuante colorido
- [x] Cards: Categoria · Cidade
- [x] Botão "Ver todos os parceiros"
- [x] API: destaques com category, banner, desconto, cashback
- [x] Listagem /parceiros: mesmo layout de card
- [x] Banner detalhe: confirma 4:1
- [x] Zero erros lint novos
