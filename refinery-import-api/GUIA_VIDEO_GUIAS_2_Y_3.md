# Guía para video: Laravel Passport, Guías 2 y 3

## Objetivo del video

Demostrar que la API tiene configurados y funcionando:

- Password Grant con usuario y contraseña.
- Access token y refresh token.
- Expiración de tokens.
- Rutas protegidas con `auth:api`.
- Consulta del usuario autenticado.
- Logout y revocación de tokens.
- Scopes para lectura, escritura y eliminación.
- Respuestas `200`, `401` y `403` según el token utilizado.

Duración recomendada: entre 8 y 12 minutos.

## Preparación antes de grabar

1. Abre el proyecto en el editor.
2. Abre Postman e importa:

   `postman/Refinery-Import-API.postman_collection.json`

3. Comprueba que las siguientes variables de la colección estén configuradas:

   - `base_url`: `http://127.0.0.1:8000`
   - `password_client_id`
   - `password_client_secret`
   - `client_credentials_id`
   - `client_credentials_secret`

4. Copia los identificadores y secretos desde `.env`, pero hazlo antes de
   comenzar a grabar. No muestres los secretos en el video.
5. Confirma que existe el usuario demostrativo:

   - Correo: `admin@refineryimport.test`
   - Contraseña: `Refinery2026!`

6. Inicia la API:

```powershell
php artisan serve
```

La dirección esperada es `http://127.0.0.1:8000`.

> No ejecutes `php artisan migrate:fresh` antes del video. Ese comando elimina
> los clientes OAuth existentes y obliga a generar nuevas credenciales.

## Estructura sugerida del video

### 1. Introducción — 30 segundos

Texto sugerido:

> En este video demostraré la configuración de las Guías 2 y 3 de Laravel
> Passport. La Guía 2 incorpora autenticación de usuarios mediante Password
> Grant, refresh tokens y logout. La Guía 3 agrega autorización granular por
> medio de scopes.

Puedes mostrar brevemente las rutas registradas:

```powershell
php artisan route:list --path=api -v
```

Se deben observar, entre otras:

- `POST /api/login`
- `GET /api/me`
- `POST /api/logout`
- Las cinco operaciones de `/api/importaciones`
- Los middleware `auth:api` y `scope:...`

---

## Demostración de la Guía 2

### 2. Password Grant y expiración — 1 minuto

Abre `app/Providers/AppServiceProvider.php`.

Muestra y explica:

```php
Passport::enablePasswordGrant();
Passport::tokensExpireIn(CarbonInterval::hours(1));
Passport::refreshTokensExpireIn(CarbonInterval::days(30));
Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));
```

Texto sugerido:

> Passport tiene habilitado Password Grant. Los access tokens duran una hora y
> los refresh tokens duran treinta días. Esto permite usar tokens de corta
> duración sin solicitar nuevamente la contraseña cada vez que expiran.

### 3. Endpoint de login — 1 minuto

Abre `app/Http/Controllers/Api/AutenticacionController.php`.

Muestra el método `login()` y señala:

- Validación de correo y contraseña.
- Lectura opcional de `scopes`.
- `grant_type` con valor `password`.
- Uso del cliente configurado en `.env`.
- Emisión mediante el servidor OAuth interno de Passport.

Después abre `routes/api.php` y muestra que `/api/login` es público, mientras
`/api/me` y `/api/logout` están dentro del grupo `auth:api`.

### 4. Login en Postman — 1 minuto

Ejecuta la solicitud:

`Guías 2 y 3 - Login con usuario y scopes`

El cuerpo utilizado es:

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

Resultado esperado: `HTTP 200`.

Señala en la respuesta, sin leer el token completo:

- `token_type`: `Bearer`
- `expires_in`: aproximadamente `3600`
- `access_token`
- `refresh_token`

Explica que la colección guarda automáticamente los dos tokens.

### 5. Usuario autenticado — 30 segundos

Ejecuta `2. Ver usuario autenticado`.

Resultado esperado: `HTTP 200` con una respuesta similar a:

```json
{
  "usuario": {
    "id": 1,
    "nombre": "Administrador de Refinería",
    "email": "admin@refineryimport.test"
  }
}
```

Texto sugerido:

> El middleware `auth:api` validó el Bearer token y Passport identificó al
> usuario propietario del token.

### 6. Renovación con refresh token — 45 segundos

Ejecuta `Renovar access token`.

La solicitud envía a `/oauth/token`:

```text
grant_type=refresh_token
refresh_token={{refresh_token}}
client_id={{password_client_id}}
client_secret={{password_client_secret}}
scope=importaciones.read importaciones.write importaciones.delete
```

Resultado esperado: `HTTP 200` con un nuevo `access_token` y un nuevo
`refresh_token`.

Texto sugerido:

> El usuario no volvió a enviar su correo ni su contraseña. Passport utilizó el
> refresh token para emitir un nuevo par de tokens y revocó el refresh token
> anterior.

---

## Demostración de la Guía 3

### 7. Definición de scopes — 1 minuto

Regresa a `app/Providers/AppServiceProvider.php` y muestra:

```php
Passport::tokensCan([
    'importaciones.read' => 'Consultar el listado y detalle de importaciones',
    'importaciones.write' => 'Crear y actualizar importaciones',
    'importaciones.delete' => 'Eliminar importaciones',
    'admin' => 'Acceso administrativo a todas las operaciones',
]);

Passport::defaultScopes(['importaciones.read']);
```

Explica que `importaciones.read` se asigna cuando el login no solicita scopes.

### 8. Middleware de autorización — 1 minuto

Abre `bootstrap/app.php` y muestra los aliases:

```php
'client' => EnsureClientIsResourceOwner::class,
'scopes' => CheckToken::class,
'scope' => CheckTokenForAnyScope::class,
```

Después abre `routes/api.php` y señala ejemplos:

```php
->middleware('scope:admin,importaciones.read');
->middleware('scope:admin,importaciones.write');
->middleware('scope:admin,importaciones.delete');
```

Texto sugerido:

> Cada ruta acepta el scope administrativo o el permiso específico de la
> operación. Un token válido sin esos permisos recibe 403 Forbidden.

### 9. Operaciones permitidas con el token completo — 1 minuto

Usando el token obtenido durante el login principal, ejecuta en Postman:

1. `3. Listar importaciones` — espera `200`.
2. `4. Crear importación` — espera `201`.
3. `5. Consultar importación creada` — espera `200`.
4. `6. Actualizar importación creada` — espera `200`.
5. `7. Eliminar importación creada` — espera `200`.

Texto sugerido:

> Este token contiene los scopes de lectura, escritura y eliminación. Por eso
> puede completar todo el CRUD.

### 10. Token limitado a lectura — 1 minuto

Abre la carpeta de Postman:

`Guía 3 - Comprobar token de solo lectura`

Ejecuta en orden:

1. `1. Login con importaciones.read` — espera `200`.
2. `2. GET permitido (200)` — espera `200`.
3. `3. DELETE denegado (403)` — espera `403`.

Texto sugerido:

> El token es auténtico y pertenece al usuario, por lo que puede entrar a las
> rutas protegidas por `auth:api`. Sin embargo, solamente contiene
> `importaciones.read`. Passport permite la consulta y rechaza la eliminación
> con 403 porque falta `importaciones.delete`.

### 11. Verificación con `tokenCan()` — 30 segundos

Abre el método `destroy()` de
`app/Http/Controllers/Api/ImportacionController.php`.

Muestra:

```php
if (! $request->user()->tokenCan('admin')
    && ! $request->user()->tokenCan('importaciones.delete')) {
    return response()->json([
        'mensaje' => 'No tienes permiso para eliminar importaciones.',
    ], 403);
}
```

Texto sugerido:

> Además del middleware, el controlador demuestra la validación condicional con
> `tokenCan()`. Esta técnica sirve cuando una decisión depende de la lógica
> interna de una operación.

---

## Cierre de la Guía 2

### 12. Logout y revocación — 45 segundos

Ejecuta `8. Cerrar sesión y revocar token` usando el `access_token` principal,
no el token de solo lectura.

Resultado esperado: `HTTP 200`.

```json
{
  "mensaje": "Sesión cerrada y tokens revocados correctamente."
}
```

Vuelve a ejecutar `2. Ver usuario autenticado`.

Resultado esperado: `HTTP 401 Unauthorized`.

También puedes volver a ejecutar `Renovar access token`. El refresh token
revocado debe ser rechazado.

Texto sugerido:

> El logout revocó tanto el access token como su refresh token. Por eso ya no es
> posible consultar rutas protegidas ni renovar esa sesión.

### 13. Conclusión — 30 segundos

Texto sugerido:

> Con esto queda demostrada la Guía 2: login por usuario, expiración, refresh y
> logout. También queda demostrada la Guía 3: emisión de tokens con scopes,
> autorización por middleware y validación con `tokenCan()`. Las respuestas 200,
> 401 y 403 confirman la diferencia entre acceso válido, token revocado y falta
> de permisos.

## Checklist antes de entregar el video

- El servidor aparece ejecutándose en `127.0.0.1:8000`.
- No se muestran secretos OAuth ni el contenido completo de `.env`.
- El login devuelve access y refresh token.
- `/api/me` responde 200 con un token válido.
- La renovación devuelve un nuevo par de tokens.
- El CRUD funciona con los scopes completos.
- Un token de solo lectura obtiene 200 en GET.
- El mismo token obtiene 403 en DELETE.
- Después del logout, `/api/me` responde 401.
- El video muestra código y funcionamiento en Postman.

## Solución rápida de problemas

### `invalid_client`

Confirma que `PASSPORT_PASSWORD_CLIENT_ID` y
`PASSPORT_PASSWORD_CLIENT_SECRET` correspondan al cliente actual de la base de
datos. Después ejecuta:

```powershell
php artisan config:clear
```

### El login responde 401

Confirma el usuario demostrativo y, si es necesario, vuelve a cargar los datos:

```powershell
php artisan db:seed
```

### Las rutas responden 403

Revisa los scopes enviados durante el login. Un 403 es el resultado esperado
cuando el token es válido, pero no tiene el permiso de la operación.

### Se ejecutó `migrate:fresh`

Los clientes OAuth fueron eliminados. Detén la grabación, créalos nuevamente y
actualiza `.env` y las variables de Postman:

```powershell
php artisan passport:client --client --name="Refinery Import Service"
php artisan passport:client --password --name="Refinery Import Password Client" --provider=users
php artisan config:clear
```

Ejecuta estos comandos fuera de cámara porque muestran los secretos una sola
vez.
