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

Genera dos tokens distintos y colócalos en `.env`:

```powershell
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

- `EXTERNAL_API_TOKEN`: credencial administrativa con CRUD completo.
- `EXTERNAL_API_CONSUMER_TOKEN`: credencial para integraciones, limitada a consultar y crear.

La API local queda en `http://127.0.0.1:8000/api/v1`. El comando
`php artisan serve` es solo para desarrollo; no debe publicarse directamente.

## Autenticación

Todas las operaciones protegidas requieren el encabezado:

```http
Authorization: Bearer <TOKEN>
Accept: application/json
```

Ejemplo:

```powershell
curl.exe -H "Accept: application/json" -H "Authorization: Bearer TU_TOKEN" http://127.0.0.1:8000/api/v1/importaciones
```

Una credencial ausente o incorrecta responde `401`. El token consumidor puede
usar `GET` y `POST`; los intentos de actualizar o eliminar responden `403`. El
token administrativo conserva el CRUD completo. Si no hay credenciales
configuradas, la API responde `503`.

## Endpoints

| Método | Endpoint | Acción | Acceso | Código correcto |
|---|---|---|---|---|
| GET | `/api/v1/salud` | Comprobar disponibilidad | Público | 200 |
| GET | `/api/v1/importaciones` | Listar importaciones | Consumidor o administrador | 200 |
| GET | `/api/v1/importaciones/{id}` | Consultar una importación | Consumidor o administrador | 200 |
| POST | `/api/v1/importaciones` | Crear una importación | Consumidor o administrador | 201 |
| PUT/PATCH | `/api/v1/importaciones/{id}` | Actualizar una importación | Solo administrador | 200 |
| DELETE | `/api/v1/importaciones/{id}` | Eliminar una importación | Solo administrador | 200 |

El listado admite:

- `buscar`: busca por BL, referencia, proveedor o material.
- `estado`: filtra por un estado válido.
- `pendiente_arribo=1`: incluye únicamente `Documentación`, `En tránsito` y `En altamar`.
- `con_contenedor=1`: excluye expedientes sin número o identificación de contenedor.
- `fecha_desde` y `fecha_hasta`: limitan la fecha estimada, en formato `AAAA-MM-DD`.
- `orden_fecha`: ordena la fecha estimada con `asc` o `desc`. Los pendientes usan `asc` por defecto.
- `per_page`: cantidad por página, entre 1 y 100; por defecto 25.
- `page`: número de página.

Ejemplo:

```text
GET /api/v1/importaciones?estado=En%20tránsito&buscar=ALFA&per_page=25&page=1
```

Listado de contenedores pendientes de arribar, ordenado por la fecha más próxima:

```text
GET /api/v1/importaciones?pendiente_arribo=1&con_contenedor=1&orden_fecha=asc&per_page=100
```

La respuesta del listado incluye `data`, `links`, `meta` y `mensaje`. El límite
por defecto es de 60 solicitudes por minuto por credencial y se configura con
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
- `consumer_token`: valor de `EXTERNAL_API_CONSUMER_TOKEN`; úsalo para listar y crear.
- `admin_token`: valor de `EXTERNAL_API_TOKEN`; resérvalo para actualizar y eliminar.

La colección guarda automáticamente el ID creado para las solicitudes de
consulta, actualización y eliminación.

La guía lista para entregar al sistema consumidor está en
[`docs/GUIA_INTEGRACION_GESTOR_TAREAS.md`](docs/GUIA_INTEGRACION_GESTOR_TAREAS.md).

## Preparación para producción

1. Usa `APP_ENV=production`, `APP_DEBUG=false` y una `APP_URL` HTTPS real.
2. Configura una base de datos de producción y ejecuta `php artisan migrate --force`.
3. Usa tokens administrativos y de consumidor distintos, y configura los orígenes CORS exactos.
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

API publicada: [https://refinery-import-api.onrender.com](https://refinery-import-api.onrender.com)

El repositorio incluye `Dockerfile` y `render.yaml` para desplegar la API en
Render Free con PHP 8.3.36, Apache y una base PostgreSQL externa como Neon. El
contenedor escucha en el puerto `8000`, ejecuta las migraciones al iniciar y
puede cargar datos iniciales temporalmente configurando `SEED_DATABASE=true`.

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
EXTERNAL_API_CONSUMER_TOKEN=...
EXTERNAL_API_ALLOWED_ORIGINS=
SEED_DATABASE=false
```

La URL de PostgreSQL, `APP_KEY` y los tokens se solicitan como secretos durante
el despliegue del Blueprint y nunca se guardan dentro del repositorio.

[Desplegar la rama en Render](https://render.com/deploy?repo=https://github.com/carlosmartde/Api_laravel/tree/deploy-koyeb)
