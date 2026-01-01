#!/bin/bash

# Script para ejecutar el scheduler de posts programados cada minuto
# Guarda logs de ejecución

LOG_DIR="$PWD/logs"
LOG_FILE="$LOG_DIR/scheduler.log"
API_URL="${1:-http://localhost:3000}/api/execute-scheduled"

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Función para log con timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🕒 SCHEDULER: Iniciando verificación de posts programados..."

# Ejecutar el endpoint del scheduler
response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    --max-time 30 \
    --connect-timeout 10)

# Verificar si la respuesta es válida
if [ $? -eq 0 ] && [ -n "$response" ]; then
    # Extraer información básica de la respuesta JSON
    success=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2)
    message=$(echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$success" = "true" ]; then
        log "✅ SCHEDULER: $message"
        
        # Si hay posts ejecutados, mostrar detalles
        executed=$(echo "$response" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        if [ -n "$executed" ] && [ "$executed" -gt 0 ]; then
            successful=$(echo "$response" | grep -o '"successful":[0-9]*' | cut -d':' -f2)
            failed=$(echo "$response" | grep -o '"failed":[0-9]*' | cut -d':' -f2)
            log "📊 SCHEDULER: Ejecutados: $executed | Exitosos: $successful | Fallaron: $failed"
        fi
    else
        log "❌ SCHEDULER: Error en la respuesta: $message"
    fi
else
    log "❌ SCHEDULER: Error de conexión o timeout al ejecutar scheduler"
fi

log "🏁 SCHEDULER: Verificación completada"
echo "" >> "$LOG_FILE" # Línea en blanco para separar ejecuciones