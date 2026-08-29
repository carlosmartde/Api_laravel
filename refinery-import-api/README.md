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
php artisan passport:client --personal --name="Postman Refinery Import"
php artisan serve
```

La API quedará disponible en `http://127.0.0.1:8000/api`. La base de datos usa
SQLite y el seeder carga cinco importaciones tomadas del proyecto original, el
usuario de demostración y las tablas OAuth2 de Passport.

Si el proyecto ya está configurado, basta con ejecutar:

```powershell
php artisan migrate:fresh --seed
php artisan passport:keys
php artisan passport:client --personal --name="Postman Refinery Import"
php artisan serve
```

## Autenticación con Laravel Passport

Passport genera claves RSA locales (`oauth-private.key` y `oauth-public.key`)
y conserva los clientes y tokens en las tablas `oauth_*`. Las claves privadas
no se guardan en Git.

Para la demostración se usa un cliente de acceso personal creado con:

```powershell
php artisan passport:client --personal --name="Postman Refinery Import"
```

Las credenciales del usuario demostrativo son:

| Campo | Valor |
|---|---|
| Correo | `admin@refineryimport.test` |
| Contraseña | `Refinery2026!` |

Genera un token con `POST /api/login`. La respuesta contiene
`access_token`; envíalo en cada solicitud protegida como:

```text
Authorization: Bearer TU_ACCESS_TOKEN
```

El endpoint `POST /api/logout` revoca el token usado en la solicitud.

## Endpoints

| Método | Endpoint | Acción | Respuesta correcta |
|---|---|---|---|
| POST | `/api/login` | Generar token Passport | 200 |
| GET | `/api/usuario` | Confirmar token y usuario autenticado | 200 |
| GET | `/api/importaciones` | Listar importaciones | 200 |
| GET | `/api/importaciones/{id}` | Consultar una importación | 200 |
| POST | `/api/importaciones` | Crear una importación | 201 |
| PUT/PATCH | `/api/importaciones/{id}` | Actualizar una importación | 200 |
| DELETE | `/api/importaciones/{id}` | Eliminar una importación | 200 |
| POST | `/api/logout` | Revocar el token actual | 200 |

Excepto `/api/login`, todos los endpoints de la tabla están protegidos con el
middleware `auth:api` y devuelven 401 si no reciben un token Bearer válido.

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
5. Ejecuta primero `1. Obtener token Passport`. La colección guarda
   automáticamente la respuesta en la variable `access_token`.
6. Ejecuta las solicitudes restantes en orden: usuario autenticado, listar,
   crear, consultar, actualizar, eliminar y cerrar sesión. La creación guarda
   automáticamente el ID para las tres solicitudes siguientes.

Todas las solicitudes protegidas ya incluyen `Authorization: Bearer
{{access_token}}`; no es necesario copiar el token manualmente.

## Guion breve para presentar

1. Mostrar `config/auth.php`, el trait `HasApiTokens` en `User` y
   `routes/api.php` con `auth:api`.
2. Ejecutar `php artisan route:list --path=api` para mostrar las rutas de
   inicio de sesión, token y CRUD protegido.
3. En Postman, ejecutar `Obtener token Passport` y enseñar el
   `access_token` devuelto.
4. Ejecutar `Ver usuario autenticado` para demostrar que el Bearer token es
   válido.
5. Ejecutar `Listar importaciones` y mostrar los datos iniciales.
6. Ejecutar `Crear importación` y señalar el código HTTP 201.
7. Ejecutar `Consultar importación creada`.
8. Ejecutar `Actualizar importación creada` y verificar estado `Recibida` y
   progreso 100.
9. Ejecutar `Eliminar importación creada`.
10. Ejecutar `Cerrar sesión y revocar token`.

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

Las pruebas verifican el requisito de token, la generación de un token Passport,
el listado con filtros, creación, validación, consulta, actualización y
eliminación.
