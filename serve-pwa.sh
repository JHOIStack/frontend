#!/bin/bash

# Script para servir la PWA con soporte para rutas de Angular
# Este script configura http-server para redirigir todas las rutas a index.html

PORT=${1:-8080}
DIR="dist/smarthabits/browser"

echo "🚀 Sirviendo SmartHabits PWA en http://localhost:$PORT"
echo ""
echo "📱 Para probar en dispositivos:"
echo "   1. Encuentra tu IP local: ifconfig | grep 'inet '"
echo "   2. Accede desde otro dispositivo: http://TU_IP:$PORT"
echo ""
echo "💡 Presiona Ctrl+C para detener el servidor"
echo ""

# Verificar que el directorio existe
if [ ! -d "$DIR" ]; then
    echo "❌ Error: El directorio $DIR no existe."
    echo "   Ejecuta 'npm run build' primero."
    exit 1
fi

# Crear un archivo index.html temporal que redirija todas las rutas
cd "$DIR"

# Usar http-server con la opción --proxy para manejar rutas de Angular
npx http-server . -p $PORT -c-1 --proxy http://localhost:$PORT?


