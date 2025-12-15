/**
 * Script simples para gerar ícones PWA usando Jimp (JavaScript puro)
 * Execute: npm install jimp && node scripts/generate-icons-simple.js
 */

const path = require('path');
const fs = require('fs');

async function generateIcons() {
  let Jimp;
  try {
    Jimp = require('jimp');
  } catch (e) {
    console.log('');
    console.log('Para gerar ícones automaticamente, execute:');
    console.log('  npm install jimp');
    console.log('  node scripts/generate-icons-simple.js');
    console.log('');
    console.log('Ou use um gerador online:');
    console.log('  https://www.pwabuilder.com/imageGenerator');
    console.log('');
    return;
  }

  const iconsDir = path.join(process.cwd(), 'public', 'icons');
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  // Criar pasta se não existir
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    // Criar imagem preta
    const image = new Jimp(size, size, 0x000000FF);
    
    // Carregar fonte
    const font = size >= 128 
      ? await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE)
      : size >= 64
        ? await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
        : await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    
    // Adicionar texto "U" centralizado
    const textWidth = Jimp.measureText(font, 'U');
    const textHeight = Jimp.measureTextHeight(font, 'U', size);
    const x = (size - textWidth) / 2;
    const y = (size - textHeight) / 2;
    
    image.print(font, x, y, 'U');
    
    // Salvar
    const filename = `icon-${size}x${size}.png`;
    await image.writeAsync(path.join(iconsDir, filename));
    console.log(`✓ Criado: ${filename}`);
  }

  console.log('');
  console.log('Ícones gerados com sucesso!');
  console.log('Substitua por ícones reais quando disponíveis.');
}

generateIcons().catch(console.error);

