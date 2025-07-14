#!/bin/bash

set -e

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sin color

# Función para checar comandos
check_command() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}Error:${NC} '$1' no está instalado."
    return 1
  fi
  return 0
}

# 1. Verificar dependencias
MISSING=0
for cmd in corepack yarn node docker docker-compose; do
  if ! check_command $cmd; then
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo -e "\n${YELLOW}Por favor instala los comandos faltantes antes de continuar.${NC}"
  echo "- Node.js: https://nodejs.org/"
  echo "- corepack: viene con Node.js >=16.10, actívalo con: corepack enable"
  echo "- Yarn: corepack prepare yarn@stable --activate"
  echo "- Docker: https://docs.docker.com/get-docker/"
  echo "- Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

# 2. Activar corepack y Yarn
corepack enable
echo -e "${GREEN}corepack habilitado${NC}"
corepack prepare yarn@stable --activate
echo -e "${GREEN}Yarn habilitado${NC}"

# 3. Instalar dependencias
cd backend
echo -e "${YELLOW}Instalando dependencias del backend...${NC}"
yarn install
cd ../frontend
echo -e "${YELLOW}Instalando dependencias del frontend...${NC}"
yarn install
cd ..

# 4. Migraciones de Prisma
echo -e "${YELLOW}Ejecutando migraciones de Prisma...${NC}"
cd backend
yarn prisma migrate deploy

# 5. Scripts de inicialización
echo -e "${YELLOW}Generando archivo .well-known/did-configuration.json...${NC}"
yarn ts-node scripts/generateDidConfiguration.ts
echo -e "${YELLOW}Creando usuario administrador...${NC}"
yarn ts-node src/scripts/createAdmin.ts
cd ..

# 6. Build de backend y frontend
echo -e "${YELLOW}Compilando backend...${NC}"
cd backend
yarn build
cd ../frontend
echo -e "${YELLOW}Compilando frontend...${NC}"
yarn build
cd ..

# 7. Levantar servicios con Docker Compose
echo -e "${GREEN}Levantando servicios con Docker Compose...${NC}"
docker-compose up -d --build

echo -e "\n${GREEN}¡Listo! El sistema está corriendo en modo producción.${NC}"
echo -e "- Backend: http://localhost:4000"
echo -e "- Frontend: http://localhost:3000" 