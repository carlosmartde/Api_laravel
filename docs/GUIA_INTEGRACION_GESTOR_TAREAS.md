# Guía de integración — Gestor de tareas

## 1. Objetivo

Esta guía describe cómo un sistema externo debe consumir la API **Refinery Import API** para cumplir estos requerimientos:

1. Mostrar el listado de contenedores pendientes de arribar al puerto, con fechas y demás información de la importación.
2. Registrar una nueva importación.

La integración está diseñada para el sistema de gestión de tareas. La credencial entregada al consumidor permite consultar y registrar, pero no modificar ni eliminar registros existentes.

## 2. Datos que debe entregar el propietario de la API

El propietario debe compartir por un medio seguro:

| Dato | Valor |
|---|---|
| URL base | `https://refinery-import-api.onrender.com` |
| Token | Valor de `EXTERNAL_API_CONSUMER_TOKEN` |
| Colección Postman | `postman/Refinery-Import-API.postman_collection.json` |

El propietario **no debe compartir** el archivo `.env`, la conexión de la base de datos, `APP_KEY` ni `EXTERNAL_API_TOKEN`. Este último es administrativo y permite eliminar información.

### Colección Postman

Puede descargarse la [colección Postman del proyecto](../postman/Refinery-Import-API.postman_collection.json). Para utilizarla:

1. Abrir Postman y seleccionar **Import**.
2. Importar `Refinery-Import-API.postman_collection.json`.
3. Abrir las variables de la colección.
4. Configurar `base_url` con `https://refinery-import-api.onrender.com`.
5. Configurar `consumer_token` con el valor entregado por el propietario.
6. No configurar ni compartir `admin_token` para esta integración.
7. Ejecutar primero **Listar contenedores pendientes de arribar** y después **Crear importación**.

Si se entrega el paquete privado preparado por el propietario, también puede importarse el archivo de entorno `Refinery-Import-API-Produccion.postman_environment.json`; este ya contiene la URL y la credencial de consumidor.

## 3. Reglas generales de las solicitudes

Todas las solicitudes protegidas deben enviarse por HTTPS e incluir:

```http
Authorization: Bearer TOKEN_CONSUMIDOR
Accept: application/json
```

Las solicitudes que envían JSON también deben incluir:

```http
Content-Type: application/json; charset=utf-8
```

No se debe colocar el token en la URL, parámetros, registros de aplicación ni mensajes de error.

## 4. Comprobar disponibilidad

Este endpoint es público y no requiere token:

```http
GET https://refinery-import-api.onrender.com/api/v1/salud
```

Respuesta correcta, HTTP `200`:

```json
{
  "estado": "ok",
  "version": "v1",
  "base_de_datos": "disponible"
}
```

En el plan gratuito el servicio puede detenerse después de un periodo sin tráfico. Se recomienda un tiempo de espera de hasta 90 segundos para la primera solicitud y un reintento si ocurre un error temporal `5xx`.

## 5. Listar contenedores pendientes de arribar

Solicitud recomendada:

```http
GET https://refinery-import-api.onrender.com/api/v1/importaciones?pendiente_arribo=1&con_contenedor=1&orden_fecha=asc&per_page=100&page=1
Authorization: Bearer TOKEN_CONSUMIDOR
Accept: application/json
```

Ejemplo con cURL:

```bash
curl --request GET \
  --url "https://refinery-import-api.onrender.com/api/v1/importaciones?pendiente_arribo=1&con_contenedor=1&orden_fecha=asc&per_page=100&page=1" \
  --header "Accept: application/json" \
  --header "Authorization: Bearer TOKEN_CONSUMIDOR"
```

El filtro `pendiente_arribo=1` incluye estos estados:

- `Documentación`
- `En tránsito`
- `En altamar`

Excluye `Proceso aduanal` y `Recibida`, porque representan mercancía que ya arribó al puerto o fue recibida.

`con_contenedor=1` excluye expedientes que todavía no tienen identificación de contenedor. `orden_fecha=asc` coloca primero el arribo más próximo.

### Filtros disponibles

| Parámetro | Descripción | Ejemplo |
|---|---|---|
| `pendiente_arribo` | Limita el resultado a estados previos al arribo | `1` |
| `con_contenedor` | Exige que el campo contenedor tenga valor | `1` |
| `fecha_desde` | Fecha estimada mínima, inclusive | `2026-11-01` |
| `fecha_hasta` | Fecha estimada máxima, inclusive | `2026-12-31` |
| `orden_fecha` | Orden de la fecha: `asc` o `desc` | `asc` |
| `estado` | Filtra por un único estado válido | `En tránsito` |
| `buscar` | Busca en BL, referencia, proveedor o material | `MSCU` |
| `per_page` | Resultados por página, entre 1 y 100 | `100` |
| `page` | Página solicitada | `1` |

Ejemplo limitado por fechas:

```http
GET /api/v1/importaciones?pendiente_arribo=1&con_contenedor=1&fecha_desde=2026-11-01&fecha_hasta=2026-12-31&orden_fecha=asc&per_page=100&page=1
```

### Estructura de la respuesta

```json
{
  "data": [
    {
      "id": 2,
      "bl": "ONEY-468201756",
      "referencia": "IMP-2026-002",
      "proveedor": "Proveedor de ejemplo",
      "material": "Equipo industrial",
      "transportista": "Naviera de ejemplo",
      "origen": "Hamburgo, Alemania",
      "puerto_destino": "Puerto Quetzal",
      "incoterm": "CIF Puerto Quetzal",
      "fecha_estimada_arribo": "2026-12-15",
      "estado": "En altamar",
      "progreso": 40,
      "contenedor": "ONEU 321954-2",
      "bultos": "4 cajas",
      "destino_planta": "Almacén principal",
      "duca": null,
      "factura": "FAC-1002",
      "valor_usd": "175500.75",
      "creada_en": "2026-10-22T12:00:00.000000Z",
      "actualizada_en": "2026-10-22T12:00:00.000000Z"
    }
  ],
  "links": {
    "first": "...page=1",
    "last": "...page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 100,
    "total": 1
  },
  "mensaje": "Importaciones consultadas correctamente."
}
```

El consumidor debe procesar `data`. Si `links.next` no es `null`, debe solicitar la siguiente página hasta completar el listado. No debe asumir que siempre habrá menos de 100 registros.

## 6. Registrar una nueva importación

Endpoint:

```http
POST https://refinery-import-api.onrender.com/api/v1/importaciones
Authorization: Bearer TOKEN_CONSUMIDOR
Accept: application/json
Content-Type: application/json; charset=utf-8
```

Ejemplo de cuerpo:

```json
{
  "bl": "MSCU-202612001",
  "referencia": "IMP-2026-031",
  "proveedor": "GEA WESTFALIA",
  "material": "Centrífuga para refinación",
  "transportista": "MSC",
  "origen": "Hamburgo, Alemania",
  "puerto_destino": "Puerto Santo Tomás",
  "incoterm": "CIF Puerto Santo Tomás",
  "fecha_estimada_arribo": "2026-12-15",
  "estado": "En tránsito",
  "progreso": 35,
  "contenedor": "MSCU 202612-1",
  "bultos": "4 cajas / 2,450 kg",
  "destino_planta": "Almacén técnico",
  "duca": "En preparación",
  "factura": "GEA-2026-882",
  "valor_usd": 175500.75
}
```

Ejemplo con cURL:

```bash
curl --request POST \
  --url "https://refinery-import-api.onrender.com/api/v1/importaciones" \
  --header "Accept: application/json" \
  --header "Authorization: Bearer TOKEN_CONSUMIDOR" \
  --header "Content-Type: application/json; charset=utf-8" \
  --data '{
    "bl": "MSCU-202612001",
    "referencia": "IMP-2026-031",
    "proveedor": "GEA WESTFALIA",
    "material": "Centrífuga para refinación",
    "transportista": "MSC",
    "origen": "Hamburgo, Alemania",
    "puerto_destino": "Puerto Santo Tomás",
    "incoterm": "CIF Puerto Santo Tomás",
    "fecha_estimada_arribo": "2026-12-15",
    "estado": "En tránsito",
    "progreso": 35,
    "contenedor": "MSCU 202612-1"
  }'
```

Respuesta correcta abreviada, HTTP `201` (la respuesta real incluye todos los campos de la importación):

```json
{
  "data": {
    "id": 6,
    "bl": "MSCU-202612001",
    "referencia": "IMP-2026-031",
    "estado": "En tránsito",
    "fecha_estimada_arribo": "2026-12-15",
    "contenedor": "MSCU 202612-1"
  },
  "mensaje": "Importación creada correctamente."
}
```

El sistema consumidor debe guardar el valor `data.id`, porque identifica el registro creado.

### Campos obligatorios

| Campo | Tipo/regla |
|---|---|
| `bl` | Texto único, máximo 50 caracteres |
| `referencia` | Texto único, máximo 50 caracteres |
| `proveedor` | Texto, máximo 150 caracteres |
| `material` | Texto, máximo 255 caracteres |
| `transportista` | Texto, máximo 150 caracteres |
| `origen` | Texto, máximo 150 caracteres |
| `puerto_destino` | Texto, máximo 150 caracteres |
| `incoterm` | Texto, máximo 100 caracteres |
| `fecha_estimada_arribo` | Fecha `AAAA-MM-DD` |
| `estado` | Uno de los estados permitidos |
| `progreso` | Entero entre 0 y 100 |

### Campos opcionales

`contenedor`, `bultos`, `destino_planta`, `duca`, `factura` y `valor_usd` son opcionales. Sin embargo, para que una importación aparezca en el listado de contenedores pendientes con `con_contenedor=1`, se debe enviar `contenedor`.

Estados válidos:

- `Documentación`
- `En tránsito`
- `En altamar`
- `Proceso aduanal`
- `Recibida`

## 7. Evitar registros duplicados

`bl` y `referencia` deben ser únicos. Si la respuesta a un `POST` se pierde por un problema de red, el consumidor no debe repetirlo inmediatamente con valores nuevos.

Primero debe consultar el BL o la referencia:

```http
GET /api/v1/importaciones?buscar=MSCU-202612001
```

Si el registro existe, debe usar el `id` retornado y considerar la creación exitosa. Si no existe, puede reintentar el `POST`.

## 8. Códigos de respuesta

| Código | Significado | Acción recomendada |
|---|---|---|
| `200` | Consulta correcta | Procesar `data` |
| `201` | Importación creada | Guardar `data.id` |
| `401` | Token ausente o incorrecto | Revisar la credencial; no reintentar automáticamente |
| `403` | Operación no permitida para el token consumidor | No intentar actualizar ni eliminar |
| `404` | Registro inexistente | Verificar el ID |
| `422` | Datos inválidos o duplicados | Mostrar y corregir los campos de `errors` |
| `429` | Límite de solicitudes alcanzado | Esperar el valor del encabezado `Retry-After` |
| `5xx` | Error temporal del servidor | Reintentar con espera progresiva y registrar el incidente |

Ejemplo de validación HTTP `422`:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "bl": ["El campo bl es obligatorio."],
    "fecha_estimada_arribo": ["La fecha estimada de arribo debe usar el formato AAAA-MM-DD."]
  }
}
```

La API admite 60 solicitudes por minuto por credencial. El consumidor debe respetar `Retry-After` cuando reciba `429`.

## 9. Restricciones de la credencial del consumidor

La credencial entregada al gestor de tareas permite:

| Operación | Permitida |
|---|---|
| Listar importaciones | Sí |
| Consultar una importación por ID | Sí |
| Registrar una importación | Sí |
| Actualizar una importación | No, responde `403` |
| Eliminar una importación | No, responde `403` |

## 10. Integración desde navegador y CORS

Si las solicitudes salen desde el backend del sistema consumidor, no se necesita configurar CORS.

Si salen directamente desde JavaScript en un navegador, el consumidor debe proporcionar al propietario el origen exacto, por ejemplo:

```text
https://gestor-tareas.example.com
```

El origen debe autorizarse antes de probar la integración. No se aceptan rutas como `/tareas` ni se recomienda usar `*`.

## 11. Pruebas de aceptación

La integración se considera completa cuando se verifican estos casos:

1. `GET /api/v1/salud` responde `200` y reporta la base de datos disponible.
2. El listado de pendientes responde `200` usando el token consumidor.
3. Todos los elementos del listado tienen `contenedor` y uno de los tres estados previos al arribo.
4. Los elementos aparecen ordenados por `fecha_estimada_arribo` ascendente.
5. El sistema recorre todas las páginas cuando `links.next` tiene valor.
6. Un `POST` válido responde `201` y retorna `data.id`.
7. Un BL o referencia duplicados responden `422` y no crean otro registro.
8. Una solicitud sin token responde `401`.
9. Un `PATCH` o `DELETE` con el token consumidor responde `403`.

## 12. Suposición del modelo actual

Cada importación contiene como máximo un valor en el campo `contenedor`. Si el negocio necesita asociar varios contenedores independientes a una sola importación, debe acordarse una ampliación futura del modelo y del contrato de la API.
