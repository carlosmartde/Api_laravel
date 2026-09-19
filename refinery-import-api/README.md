# Refinery Import API

API REST desarrollada con Laravel para administrar las importaciones de una
refinería de aceite de palma. El proyecto conserva el contexto de la aplicación
móvil `RefineryImportApp`: cada expediente se identifica mediante su número de
BL/BOL y registra proveedor, material, transporte, aduana y destino en planta.

El CRUD se expone exclusivamente desde `routes/api.php`. La aplicación no
registra ni utiliza `routes/web.php`. Todas las operaciones del CRUD requieren
un token Bearer emitido por Laravel Passport.

## Requisitos

- PHP 8.3 o superior.
- Composer.
- Extensión PDO SQLite habilitada.
- Postman para consumir y demostrar los endpoints.

## Instalación

Desde PowerShell, dentro de esta carpeta:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
New-Item database\database.sqlite -ItemType File -Force
php artisan migrate:fresh --seed
php artisan passport:keys
php artisan passport:client --client --name="Refinery Import Service"
php artisan passport:client --password --name="Refinery Import Password Client" --provider=users
php artisan serve
```

La API quedará disponible en `http://127.0.0.1:8000/api`. La base de datos usa
SQLite y el seeder carga cinco importaciones tomadas del proyecto original, el
usuario de demostración y las tablas OAuth2 de Passport.

Si el proyecto ya está configurado, basta con ejecutar:

```powershell
php artisan migrate:fresh --seed
php artisan passport:keys
php artisan passport:client --client --name="Refinery Import Service"
php artisan passport:client --password --name="Refinery Import Password Client" --provider=users
php artisan serve
```

Guarda los identificadores y secretos generados en `.env`:

```dotenv
PASSPORT_CLIENT_ID=
PASSPORT_CLIENT_SECRET=
PASSPORT_PASSWORD_CLIENT_ID=
PASSPORT_PASSWORD_CLIENT_SECRET=
```

El primer par se usa en Postman para Client Credentials. La aplicación utiliza
el segundo par para el login Password Grant. `.env` y las claves privadas están
excluidos de Git.

## Guía 1: Client Credentials

Passport genera claves RSA locales (`oauth-private.key` y `oauth-public.key`)
y conserva los clientes y tokens en las tablas `oauth_*`.

El cliente máquina-a-máquina obtiene su token con:

```text
POST /oauth/token
grant_type=client_credentials
client_id=PASSPORT_CLIENT_ID
client_secret=PASSPORT_CLIENT_SECRET
scope=importaciones.read
```

El token puede consultar `GET /api/servicio/importaciones`. Esa ruta utiliza el
middleware `client` de Passport y no representa a un usuario.

## Guía 2: Password Grant, refresh y logout

El endpoint `POST /api/login` valida al usuario mediante Password Grant y
devuelve `access_token`, `refresh_token` y `expires_in`. El access token dura
una hora y el refresh token treinta días.

Las credenciales demostrativas son:

| Campo | Valor |
|---|---|
| Correo | `admin@refineryimport.test` |
| Contraseña | `Refinery2026!` |

Envía el access token en cada solicitud protegida:

```text
Authorization: Bearer TU_ACCESS_TOKEN
```

Renueva la sesión mediante `POST /oauth/token` con
`grant_type=refresh_token`. El endpoint `POST /api/logout` revoca el access
token y su refresh token asociado.

## Guía 3: scopes

El login acepta un arreglo opcional `scopes`. Si se omite, asigna
`importaciones.read`:

```json
{
  "email": "admin@refineryimport.test",
  "password": "Refinery2026!",
  "scopes": [
    "importaciones.read",
    "importaciones.write",
    "importaciones.delete"
  ]
}
```

Scopes disponibles:

| Scope | Permiso |
|---|---|
| `importaciones.read` | Listar y consultar importaciones |
| `importaciones.write` | Crear y actualizar importaciones |
| `importaciones.delete` | Eliminar importaciones |
| `admin` | Acceso a todas las operaciones |

Las rutas verifican sus scopes con los middleware de Passport. La eliminación
también comprueba `tokenCan()` dentro del controlador.

## Endpoints

| Método | Endpoint | Acción | Respuesta correcta |
|---|---|---|---|
| POST | `/oauth/token` | Emitir o renovar tokens OAuth | 200 |
| GET | `/api/servicio/importaciones` | Listar mediante Client Credentials | 200 |
| POST | `/api/login` | Login Password Grant con scopes | 200 |
| GET | `/api/me` | Confirmar token y usuario autenticado | 200 |
| GET | `/api/usuario` | Confirmar token y usuario autenticado | 200 |
| GET | `/api/importaciones` | Listar importaciones | 200 |
| GET | `/api/importaciones/{id}` | Consultar una importación | 200 |
| POST | `/api/importaciones` | Crear una importación | 201 |
| PUT/PATCH | `/api/importaciones/{id}` | Actualizar una importación | 200 |
| DELETE | `/api/importaciones/{id}` | Eliminar una importación | 200 |
| POST | `/api/logout` | Revocar el token actual | 200 |

El CRUD exige `auth:api` y el scope correspondiente. Un token ausente o inválido
recibe 401; un token válido sin el permiso requerido recibe 403. El endpoint de
servicio utiliza el middleware `client` y exige `importaciones.read`.

El listado también acepta filtros opcionales:

```text
GET /api/importaciones?estado=En%20tránsito
GET /api/importaciones?buscar=ALFA
GET /api/importaciones?estado=Recibida&buscar=VEOLIA
```

## JSON para crear una importación

En Postman selecciona `Body > raw > JSON` y usa:

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

Valores válidos para `estado`: `Documentación`, `En tránsito`, `En altamar`,
`Proceso aduanal` y `Recibida`. El progreso debe ser un entero entre 0 y 100.

## Pruebas con Postman

1. Inicia Laravel con `php artisan serve`.
2. En Postman selecciona `Import`.
3. Importa `postman/Refinery-Import-API.postman_collection.json`.
4. Abre la colección `Refinery Import API` y confirma que la variable
   `base_url` sea `http://127.0.0.1:8000`.
5. Copia en las variables de la colección los identificadores y secretos de los
   clientes creados durante la instalación.
6. Ejecuta la carpeta `Guía 1 - Client Credentials`.
7. Ejecuta `Guías 2 y 3 - Login con usuario y scopes`. La colección guarda
   automáticamente `access_token` y `refresh_token`.
8. Prueba la renovación, el CRUD y el logout.
9. Ejecuta la carpeta `Guía 3 - Comprobar token de solo lectura` para comprobar
   una respuesta 200 al leer y 403 al eliminar.

Todas las solicitudes protegidas ya incluyen `Authorization: Bearer
{{access_token}}`; no es necesario copiar el token manualmente.

## Guion breve para presentar

1. Obtener un token Client Credentials y consultar el endpoint de servicio.
2. Iniciar sesión con Password Grant y mostrar access y refresh token.
3. Renovar el access token sin reenviar la contraseña.
4. Consultar `/api/me` y ejecutar el CRUD con los tres scopes.
5. Iniciar sesión con solo `importaciones.read`.
6. Mostrar que GET responde 200 y DELETE responde 403.
7. Cerrar sesión y comprobar la revocación.

## Estructura principal

```text
app/Http/Controllers/Api/ImportacionController.php
app/Http/Controllers/Api/AutenticacionController.php
app/Http/Requests/GuardarImportacionRequest.php
app/Http/Resources/ImportacionResource.php
app/Models/Importacion.php
database/migrations/2026_08_21_000000_create_importaciones_table.php
database/seeders/DatabaseSeeder.php
config/auth.php
config/passport.php
routes/api.php
tests/Feature/ImportacionApiTest.php
postman/Refinery-Import-API.postman_collection.json
```

## Pruebas automatizadas

```powershell
php artisan test
```

Las pruebas verifican Client Credentials, Password Grant, refresh, logout,
scopes, respuestas 403 y el CRUD completo.
