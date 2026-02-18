#!/bin/bash
# Performance Test Script for API /home
# Usage: ./test-api-performance.sh [session-token]

SESSION_TOKEN="${1:-YOUR_SESSION_TOKEN_HERE}"

echo "======================================"
echo "🔍 API /home Performance Test"
echo "======================================"
echo ""

# Test 1: Measure response time
echo "📊 Test 1: Response Time Measurement"
echo "--------------------------------------"
curl -w "\n\n⏱️  Tempo total: %{time_total}s\n⏱️  Tempo TTFB: %{time_starttransfer}s\n⏱️  Tamanho: %{size_download} bytes\n" \
  -o /dev/null -s http://localhost:3000/api/app/home \
  -H "Cookie: next-auth.session-token=${SESSION_TOKEN}"

echo ""
echo "======================================"
echo ""

# Test 2: Check server logs
echo "📝 Test 2: Server Performance Logs"
echo "--------------------------------------"
echo "Faça uma requisição no navegador e veja os logs no terminal do dev server:"
echo ""
echo "Exemplo esperado:"
echo "[API /home] Grupo 1 (user + assinante): 45ms"
echo "[API /home] Grupo 2 (categories + destaques + novidades): 280ms"
echo "[API /home] Grupo 3 (parceiros + categorias do plano): 120ms"
echo "[API /home] ⚡ TOTAL: 450ms"
echo ""
echo "======================================"
echo ""

# Test 3: Response size analysis
echo "📦 Test 3: Response Size Analysis"
echo "--------------------------------------"
RESPONSE=$(curl -s http://localhost:3000/api/app/home \
  -H "Cookie: next-auth.session-token=${SESSION_TOKEN}")

TOTAL_SIZE=$(echo "$RESPONSE" | wc -c)
PARCEIROS_COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l)

echo "Tamanho total: $TOTAL_SIZE bytes"
echo "Número de objetos (aprox): $PARCEIROS_COUNT"
echo ""
echo "======================================"
echo ""

# Test 4: Verify Promise.all
echo "🔧 Test 4: Code Verification"
echo "--------------------------------------"
echo "Promise.all encontrados:"
grep -n "Promise.all" src/app/api/app/home/route.ts
echo ""
echo "Performance logs encontrados:"
grep -n "performance.now\|console.log.*API /home" src/app/api/app/home/route.ts | head -10
echo ""
echo "======================================"
echo ""

echo "✅ Teste completo!"
echo ""
echo "💡 Dicas para otimização:"
echo "1. Se Grupo 2 > 200ms → Muitos parceiros com avaliacoes (N+1)"
echo "2. Se Grupo 3 > 150ms → benefitAccess pesado"
echo "3. Se TOTAL > 500ms → Considerar cache ou índices"
