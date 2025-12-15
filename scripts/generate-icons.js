/**
 * Script para gerar ícones PWA placeholder
 * Execute: npm install canvas && node scripts/generate-icons.js
 * 
 * Ou substitua manualmente os ícones em public/icons/ pelos seus ícones reais
 */

const fs = require('fs');
const path = require('path');

// Verifica se canvas está instalado
let createCanvas;
try {
  createCanvas = require('canvas').createCanvas;
} catch (e) {
  console.log('');
  console.log('='.repeat(60));
  console.log('INSTRUÇÕES PARA GERAR ÍCONES PWA');
  console.log('='.repeat(60));
  console.log('');
  console.log('OPÇÃO 1: Instalar canvas e executar este script');
  console.log('  npm install canvas');
  console.log('  node scripts/generate-icons.js');
  console.log('');
  console.log('OPÇÃO 2: Criar ícones manualmente');
  console.log('  1. Acesse: https://realfavicongenerator.net/');
  console.log('  2. Faça upload da sua logo');
  console.log('  3. Baixe os ícones gerados');
  console.log('  4. Copie para public/icons/');
  console.log('');
  console.log('OPÇÃO 3: Usar um gerador online');
  console.log('  1. Acesse: https://www.pwabuilder.com/imageGenerator');
  console.log('  2. Faça upload da sua logo');
  console.log('  3. Baixe os ícones');
  console.log('  4. Copie icon-192x192.png e icon-512x512.png para public/icons/');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  process.exit(0);
}

// Configurações
const iconsDir = path.join(process.cwd(), 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const bgColor = '#000000';
const textColor = '#ffffff';
const text = 'U';

// Criar pasta se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar cada tamanho
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, size, size);

  // Texto
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.floor(size * 0.6)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 2);

  // Salvar
  const buffer = canvas.toBuffer('image/png');
  const filename = `icon-${size}x${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), buffer);
  console.log(`✓ Criado: ${filename}`);
});

console.log('');
console.log('Ícones gerados com sucesso em public/icons/');
console.log('');
console.log('IMPORTANTE: Substitua estes ícones placeholder pelos ícones');
console.log('reais da sua marca assim que possível!');

