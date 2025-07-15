# CigoModuloPago - Instrucciones de Instalación y Uso
Nota a los jueces, si no pueden acceder al dominio es porque tengo offlin el servicio, mándenme un correo para habilitarlo y mantenerlo arriba 3 días continuos, debido a que es mi servidor de desarrollo y sigo trabajando en otros modulos. 

Para descargar la wallet sporran de manejo de identidad: https://github.com/KILT-Foundation/sporran-extension/blob/main/docs/external.md
**La blockchain de KILT usa BIP39 así que cualquier seed phrase de Ethereum, L2s, o Bitcoin, puede usar la misma seed phrase para traer a esta wallet. Por el momento no es multicadena, apesar que Polkadot si acepta varios tokens**

**Sería divertido que Bitso desplegará su contrato de mxnb en Polkadot, ya que se aceptan Smart Contracts**

¡Bienvenido! Este proyecto está listo para ser probado y evaluado fácilmente. Sigue estos pasos para instalar y correr todo el sistema en minutos.

---

## 🚀 Requisitos Previos

- **Node.js** (>=16.10)
- **corepack** (incluido con Node.js >=16.10)
- **Yarn** (se activa con corepack)
- **Docker** y **Docker Compose**

---

## ⚙️ Instalación Rápida (Modo Producción)

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/cryptohumano/PerantoBitsoHack
   cd CigoModuloPago
   ```

2. **Configura las variables de entorno:**
   - Ve a la carpeta `backend`:
     ```bash
     cd backend
     cp .env.example .env
     # Edita .env y pon tus valores reales
     ```
   - Asegúrate de poner el mnemonic y DID del admin correctamente.

3. **Vuelve a la raíz del proyecto:**
   ```bash
   cd ..
   ```

4. **Ejecuta el script de setup:**
   ```bash
   bash setup.sh
   ```
   El script instalará dependencias, correrá migraciones, generará el archivo DID y creará el usuario admin, compilará todo y levantará los servicios con Docker Compose.

5. **¡Listo!**
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000

---

## 🛠️ Modo Desarrollo (opcional)

Si quieres trabajar en modo desarrollo (hot reload, logs detallados):

1. **Levanta solo la base de datos:**
   ```bash
   docker-compose up -d postgres
   ```
2. **En dos terminales diferentes:**
   - **Backend:**
     ```bash
     cd backend
     yarn dev
     ```
   - **Frontend:**
     ```bash
     cd frontend
     yarn dev
     ```

---

## 🧑‍💻 Scripts de Inicialización

- **Generar archivo .well-known/did-configuration.json:**
  ```bash
  cd backend
  yarn ts-node scripts/generateDidConfiguration.ts
  ```
- **Crear usuario administrador:**
  ```bash
  cd backend
  yarn ts-node src/scripts/createAdmin.ts
  ```

---

## 📝 Notas Importantes

- El archivo `.env` debe estar en la carpeta `backend`.
- El mnemonic y DID del admin deben coincidir con los que quieres usar para acceso total.
- Si cambias puertos, actualiza las variables de entorno y el docker-compose.
- Si usas Windows, puedes adaptar el script `setup.sh` a PowerShell.

---

## ❓ Troubleshooting

- **¿Faltan dependencias?**
  - El script te dirá qué instalar y cómo hacerlo.
- **¿Problemas con Docker?**
  - Asegúrate de que Docker esté corriendo y que tienes permisos.
- **¿Errores de conexión a la base de datos?**
  - Revisa que el servicio `postgres` esté arriba y que las variables de entorno sean correctas.

---

## 📫 Soporte

Si tienes dudas, revisa los comentarios en el código y este README. edoga.salinas@gmail.com 
