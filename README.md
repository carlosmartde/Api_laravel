# Refinery Import API

API REST versionada, desarrollada con Laravel, para consultar y administrar
expedientes de importación. El CRUD devuelve JSON, requiere un token Bearer,
aplica límite de solicitudes y pagina los listados.

## Requisitos

- PHP 8.3 o superior y Composer.
- SQLite para desarrollo local.
- MySQL o PostgreSQL recomendado en producción si habrá concurrencia.
- Un servidor web apuntando exclusivamente a `public/` y HTTPS en producción.

## Instalación local

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
New-Item database\database.sqlite -ItemType File -Force
php artisan migrate --seed
php artisan serve
```

Genera un token y colócalo en `EXTERNAL_API_TOKEN` dentro de `.env`:

```powershell
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

La API local queda en `http://127.0.0.1:8000/api/v1`. El comando
`php artisan serve` es solo para desarrollo; no debe publicarse directamente.

## Autenticación

Todo el CRUD requiere el encabezado:

```http
Authorization: Bearer <EXTERNAL_API_TOKEN>
Accept: application/json
```

Ejemplo:

```powershell
curl.exe -H "Accept: application/json" -H "Authorization: Bearer TU_TOKEN" http://127.0.0.1:8000/api/v1/importaciones
```

Una credencial ausente o incorrecta responde `401`. Si el servidor no tiene
configurado el token, responde `503`. Para rotarlo, cambia
`EXTERNAL_API_TOKEN` en el servidor y en el sistema consumidor y ejecuta
`php artisan config:cache`.

## Endpoints

| Método | Endpoint | Acción | Código correcto |
|---|---|---|---|
| GET | `/api/v1/salud` | Comprobar disponibilidad, sin token | 200 |
| GET | `/api/v1/importaciones` | Listar importaciones | 200 |
| GET | `/api/v1/importaciones/{id}` | Consultar una importación | 200 |
| POST | `/api/v1/importaciones` | Crear una importación | 201 |
| PUT/PATCH | `/api/v1/importaciones/{id}` | Actualizar una importación | 200 |
| DELETE | `/api/v1/importaciones/{id}` | Eliminar una importación | 200 |

El listado admite:

- `buscar`: busca por BL, referencia, proveedor o material.
- `estado`: filtra por un estado válido.
- `per_page`: cantidad por página, entre 1 y 100; por defecto 25.
- `page`: número de página.

Ejemplo:

```text
GET /api/v1/importaciones?estado=En%20tránsito&buscar=ALFA&per_page=25&page=1
```

La respuesta del listado incluye `data`, `links`, `meta` y `mensaje`. El límite
por defecto es de 60 solicitudes por minuto por token y se configura con
`EXTERNAL_API_RATE_LIMIT`.

## JSON para crear una importación

```json
{
  "bl": "MSCU-202608001",
  "referencia": "IMP-2026-030",
  "proveedor": "GEA WESTFALIA",
  "material": "Centrífuga para refinación",
  "transportista": "MSC",
  "origen": "Hamburgo, Alemania",
  "puerto_destino": "Puerto Santo Tomás",
  "incoterm": "CIF Puerto Santo Tomás",
  "fecha_estimada_arribo": "2026-09-15",
  "estado": "En tránsito",
  "progreso": 35,
  "contenedor": "MSCU 202608-1",
  "bultos": "4 cajas / 2,450 kg",
  "destino_planta": "Edificio de Refinería · Almacén técnico",
  "duca": "En preparación",
  "factura": "GEA-2026-882",
  "valor_usd": 175500.75
}
```

Estados permitidos: `Documentación`, `En tránsito`, `En altamar`,
`Proceso aduanal` y `Recibida`. Los errores de validación responden `422` con
los campos rechazados.

## CORS

CORS solo interviene cuando el consumidor se ejecuta en un navegador. Define
sus orígenes exactos, separados por comas y sin rutas:

```dotenv
EXTERNAL_API_ALLOWED_ORIGINS=https://sistema.example.com,https://admin.example.com
```

Para una integración servidor a servidor puede dejarse vacío. No se recomienda
usar `*` en producción.

## Postman

Importa `postman/Refinery-Import-API.postman_collection.json` y configura:

- `base_url`: URL del servidor, sin `/api/v1` al final.
- `api_token`: el mismo valor de `EXTERNAL_API_TOKEN`.

La colección guarda automáticamente el ID creado para las solicitudes de
consulta, actualización y eliminación.

## Preparación para producción

1. Usa `APP_ENV=production`, `APP_DEBUG=false` y una `APP_URL` HTTPS real.
2. Configura una base de datos de producción y ejecuta `php artisan migrate --force`.
3. Usa un token aleatorio exclusivo y los orígenes CORS exactos.
4. Instala con `composer install --no-dev --optimize-autoloader`.
5. Ejecuta `php artisan optimize`; repítelo después de cambiar el `.env`.
6. Configura el document root del servidor web en `public/`, HTTPS y copias de seguridad.
7. No publiques `.env`, `database/database.sqlite`, `vendor/` ni el servidor de Artisan.
8. Supervisa los códigos `401`, `422`, `429` y `5xx` en los logs.

La infraestructura (dominio, certificado TLS, firewall, servidor web y base de
datos) debe configurarse en el entorno donde se desplegará la API.

## Verificación

```powershell
php artisan test
php artisan route:list --path=api -v
composer validate --strict
```

Las pruebas cubren salud, autenticación, CORS, filtros, paginación, creación,
validación, consulta, actualización y eliminación.

## Despliegue gratuito de referencia

El repositorio incluye `Dockerfile` y `render.yaml` para desplegar la API en
Render Free con PHP 8.3.36, Apache y una base PostgreSQL externa como Neon. El
contenedor escucha en el puerto `8000`, ejecuta las migraciones al iniciar y
puede cargar los datos iniciales configurando `SEED_DATABASE=true`.

Variables mínimas del servicio:

```dotenv
APP_NAME=Refinery Import API
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
LOG_CHANNEL=stderr
DB_CONNECTION=pgsql
DB_URL=postgresql://...
EXTERNAL_API_TOKEN=...
EXTERNAL_API_ALLOWED_ORIGINS=
SEED_DATABASE=true
```

La URL de PostgreSQL, `APP_KEY` y los tokens se solicitan como secretos durante
el despliegue del Blueprint y nunca se guardan dentro del repositorio.

[Desplegar la rama en Render](https://render.com/deploy?repo=https://github.com/carlosmartde/Api_laravel/tree/deploy-koyeb)
