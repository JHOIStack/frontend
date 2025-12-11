# Generar Iconos para PWA

Para que la PWA funcione correctamente, necesitas generar los iconos en diferentes tamaños.

## Opción 1: Usar una herramienta online
1. Ve a https://www.pwabuilder.com/imageGenerator
2. Sube una imagen cuadrada de al menos 512x512 píxeles
3. Descarga los iconos generados
4. Colócalos en la carpeta `public/icons/`

## Opción 2: Usar ImageMagick (si está instalado)
```bash
# Crear iconos desde una imagen base (icon-base.png de 512x512)
convert icon-base.png -resize 72x72 public/icons/icon-72x72.png
convert icon-base.png -resize 96x96 public/icons/icon-96x96.png
convert icon-base.png -resize 128x128 public/icons/icon-128x128.png
convert icon-base.png -resize 144x144 public/icons/icon-144x144.png
convert icon-base.png -resize 152x152 public/icons/icon-152x152.png
convert icon-base.png -resize 192x192 public/icons/icon-192x192.png
convert icon-base.png -resize 384x384 public/icons/icon-384x384.png
convert icon-base.png -resize 512x512 public/icons/icon-512x512.png
```

## Opción 3: Usar un script Node.js
Puedes usar el paquete `sharp` o `jimp` para generar los iconos programáticamente.

## Tamaños requeridos:
- 72x72
- 96x96
- 128x128
- 144x144
- 152x152
- 192x192
- 384x384
- 512x512

## Nota temporal
Por ahora, puedes usar el favicon.ico existente como placeholder. Los iconos se generarán cuando tengas el diseño final.


