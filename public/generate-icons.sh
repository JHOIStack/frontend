#!/bin/bash

# Script para generar todos los iconos PWA desde un icono base
# Uso: ./generate-icons.sh [ruta-al-icono-base.png]

ICON_BASE="${1:-icon-192x192.png}"
ICONS_DIR="$(dirname "$0")/icons"

if [ ! -f "$ICONS_DIR/$ICON_BASE" ]; then
    echo "❌ Error: No se encontró $ICON_BASE en $ICONS_DIR"
    echo "   Uso: $0 [ruta-al-icono-base.png]"
    exit 1
fi

echo "🎨 Generando iconos PWA desde $ICON_BASE..."
echo ""

# Convertir a PNG si es necesario
TEMP_PNG="$ICONS_DIR/icon-temp.png"
sips -s format png "$ICONS_DIR/$ICON_BASE" --out "$TEMP_PNG" >/dev/null 2>&1

if [ ! -f "$TEMP_PNG" ]; then
    echo "❌ Error: No se pudo convertir el icono base a PNG"
    exit 1
fi

# Generar todos los tamaños
SIZES=(72 96 128 144 152 192 384 512)
SUCCESS=0
FAILED=0

for size in "${SIZES[@]}"; do
    OUTPUT="$ICONS_DIR/icon-${size}x${size}.png"
    if sips -z $size $size "$TEMP_PNG" --out "$OUTPUT" >/dev/null 2>&1; then
        # Verificar que el tamaño sea correcto
        ACTUAL_SIZE=$(sips -g pixelWidth -g pixelHeight "$OUTPUT" 2>/dev/null | grep -E "pixelWidth|pixelHeight" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
        if [ "$ACTUAL_SIZE" = "${size}x${size}" ]; then
            echo "✅ icon-${size}x${size}.png creado correctamente"
            ((SUCCESS++))
        else
            echo "❌ icon-${size}x${size}.png tiene tamaño incorrecto: $ACTUAL_SIZE (esperado ${size}x${size})"
            ((FAILED++))
        fi
    else
        echo "❌ Error creando icon-${size}x${size}.png"
        ((FAILED++))
    fi
done

# Limpiar archivo temporal
rm -f "$TEMP_PNG"

echo ""
if [ $FAILED -eq 0 ]; then
    echo "✅ Todos los iconos generados correctamente ($SUCCESS iconos)"
    echo ""
    echo "📦 Próximo paso: Ejecuta 'npm run build' para copiar los iconos al build"
else
    echo "⚠️  Se generaron $SUCCESS iconos, pero $FAILED fallaron"
    exit 1
fi


