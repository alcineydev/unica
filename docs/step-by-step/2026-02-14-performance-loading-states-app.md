# Performance: Loading States App Assinante

**Data:** 2026-02-14  
**Tipo:** Performance — UX de carregamento

---

## Problema
Mesmo problema do admin — navegação entre páginas do app assinante causava travamento visual enquanto a página carregava.

## Solução
12 `loading.tsx` com skeletons contextiais para cada página do app assinante.

---

## Arquivos Criados/Atualizados (12)

| Arquivo | Layout |
|---------|--------|
| `app/loading.tsx` | Hero dual (dark mobile + light desktop) + content |
| `app/parceiros/loading.tsx` | Search + pills + cards responsivos |
| `app/parceiros/[id]/loading.tsx` | Banner + logo + stats + benefits |
| `app/carteira/loading.tsx` | QR centralizado + balance cards |
| `app/notificacoes/loading.tsx` | Pills + cards |
| `app/perfil/loading.tsx` | Avatar + form sections |
| `app/planos/loading.tsx` | Plano atual dark + grid |
| `app/buscar/loading.tsx` | Search + tags + results |
| `app/categorias/loading.tsx` | Grid 2-4 colunas |
| `app/categoria/[slug]/loading.tsx` | Título + cards responsivos |
| `app/minhas-avaliacoes/loading.tsx` | Cards |
| `app/avaliar/[parceiroId]/loading.tsx` | Info + stars + form + button |

---

## Destaques
- Home skeleton replica as cores reais do hero (dark navy mobile, white desktop)
- Todos os skeletons respeitam o padding padrão (`px-4 pt-4 lg:px-10 lg:pt-8`)
- Responsive: layouts diferentes para mobile e desktop onde aplicável
- Server Components puros (sem 'use client')
- Zero erros de lint
