# Refinery Import API

API REST desarrollada con Laravel para administrar las importaciones de una
refinería de aceite de palma. El proyecto conserva el contexto de la aplicación
móvil `RefineryImportApp`: cada expediente se identifica mediante su número de
BL/BOL y registra proveedor, material, transporte, aduana y destino en planta.

El CRUD se expone exclusivamente desde `routes/api.php`. La aplicación no
registra ni utiliza `routes/web.php`.

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
php artisan serve
```

La API quedará disponible en `http://127.0.0.1:8000/api`. La base de datos usa
SQLite y el seeder carga cinco importaciones tomadas del proyecto original.

Si el proyecto ya está configurado, basta con ejecutar:

```powershell
php artisan migrate:fresh --seed
php artisan serve
```

## Endpoints del CRUD

| Método | Endpoint | Acción | Respuesta correcta |
|---|---|---|---|
| GET | `/api/importaciones` | Listar importaciones | 200 |
| GET | `/api/importaciones/{id}` | Consultar una importación | 200 |
| POST | `/api/importaciones` | Crear una importación | 201 |
| PUT/PATCH | `/api/importaciones/{id}` | Actualizar una importación | 200 |
| DELETE | `/api/importaciones/{id}` | Eliminar una importación | 200 |

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
5. Ejecuta las solicitudes en orden: listar, crear, consultar, actualizar y
   eliminar. La solicitud de creación guarda automáticamente el ID para las
   tres solicitudes siguientes.

Todas las solicitudes ya incluyen los encabezados `Accept: application/json`
y `Content-Type: application/json`.

## Guion breve para presentar

1. Mostrar `routes/api.php` y explicar `Route::apiResource`.
2. Ejecutar `php artisan route:list --path=api` para enseñar los cinco tipos de
   operaciones CRUD expuestos por API.
3. En Postman, ejecutar `Listar importaciones` y mostrar los datos iniciales.
4. Ejecutar `Crear importación` y señalar el código HTTP 201.
5. Ejecutar `Consultar importación creada`.
6. Ejecutar `Actualizar importación creada` y verificar estado `Recibida` y
   progreso 100.
7. Ejecutar `Eliminar importación creada`.
8. Volver a listar para comprobar que el registro fue eliminado.

## Estructura principal

```text
app/Http/Controllers/Api/ImportacionController.php
app/Http/Requests/GuardarImportacionRequest.php
app/Http/Resources/ImportacionResource.php
app/Models/Importacion.php
database/migrations/2026_08_21_000000_create_importaciones_table.php
database/seeders/DatabaseSeeder.php
routes/api.php
tests/Feature/ImportacionApiTest.php
postman/Refinery-Import-API.postman_collection.json
```

## Pruebas automatizadas

```powershell
php artisan test
```

Las pruebas verifican listado con filtros, creación, validación, consulta,
actualización y eliminación.
