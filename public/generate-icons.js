// Script simple para generar iconos placeholder
// Requiere: npm install sharp (opcional, o usar ImageMagick)

const fs = require('fs');
const path = require('path');

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Crear iconos placeholder simples (SVG convertido a PNG sería mejor, pero esto es un placeholder)
console.log('Para generar los iconos reales:');
console.log('1. Crea una imagen cuadrada de 512x512 píxeles con el logo de SmartHabits');
console.log('2. Usa una herramienta online como https://www.pwabuilder.com/imageGenerator');
console.log('3. O usa ImageMagick: convert icon-base.png -resize SIZExSIZE public/icons/icon-SIZExSIZE.png');
console.log('\nTamaños necesarios:');
iconSizes.forEach(size => {
  console.log(`- icon-${size}x${size}.png`);
});

console.log('\nPor ahora, puedes usar el favicon.ico como placeholder temporal.');


