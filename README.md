# Palm Refinery Logistics

Aplicación móvil multiplataforma creada con React Native y Expo para controlar
importaciones de materiales, equipos y materias primas destinados a una
refinería de aceite de palma.

## Funcionalidades

- Dashboard de importaciones recibidas, en tránsito, en aduana y con
  documentación pendiente.
- Expediente permanente por número de BL/BOL.
- Versionado de DUCA, factura comercial y packing list dentro de cada BL.
- Carga de documentos PDF o imágenes mediante el selector del dispositivo.
- Seguimiento por proveedor, transportista, contenedor, ETA e Incoterm.
- Directorio de proveedores y contactos logísticos.
- Ubicaciones internas: Refinería, Utilidades, WTP, ETP y Tank Farm.
- Registro de tanques CPO y RPO/oleína.

## Pantallas y componentes

1. **Inicio:** dashboard y alertas logísticas.
2. **Importaciones:** búsqueda y control de expedientes por BL.
3. **Planta:** destinos internos y capacidades de Tank Farm.
4. **Proveedores:** directorio de empresas y contactos.
5. **Detalle del BL:** documentos, versiones y datos de la operación.
6. **Satélites NASA:** catálogo consultable de misiones activas de observación terrestre.
7. **Detalle del satélite:** características, instrumentos y galería obtenida en vivo desde NASA Images API.

## Integración con NASA

El módulo de satélites consume la API pública oficial de NASA Image and Video
Library (`https://images-api.nasa.gov`). Este servicio no requiere una clave y
permite cargar las galerías sin exponer credenciales dentro de la aplicación.
Si no hay conexión, el catálogo y las características siguen disponibles y la
interfaz permite reintentar la carga de imágenes.

Todos son componentes compatibles con Expo/React Native; la app excede el
mínimo solicitado de cuatro pantallas y tres componentes por pantalla.

## Lo que necesitas instalar

1. Node.js LTS 20.19 o posterior: <https://nodejs.org/>
2. Visual Studio Code: <https://code.visualstudio.com/>
3. En tu teléfono, la aplicación **Expo Go** desde Google Play o App Store.

## Cómo ejecutar el proyecto

Abre PowerShell dentro de esta carpeta y ejecuta:

```powershell
npm install
npx expo start
```

Cuando aparezca el código QR:

- Android: abre Expo Go y selecciona **Scan QR code**.
- iPhone: escanea el QR con la cámara.
- Computadora: presiona `w` en la terminal para abrir la versión web.

El teléfono y la computadora deben estar conectados a la misma red Wi-Fi. Si
la red bloquea la conexión, ejecuta:

```powershell
npx expo start --tunnel
```

## Qué archivo se modifica

La interfaz y los datos de ejemplo están en `App.js`. `app.json` contiene el
nombre y la configuración de Expo; `package.json` contiene las dependencias.

## Guion breve para presentar

> Refinery Import centraliza el proceso desde la compra internacional hasta la
> ubicación física del material dentro de la refinería. Permite visualizar el
> flete marítimo, el Incoterm, el avance aduanal, los documentos, los costos de
> importación y la trazabilidad interna del inventario. Fue desarrollada con
> React Native y Expo, por lo que funciona en Android, iOS y web desde una misma
> base de código.

## Alcance académico

Los datos y contactos son demostrativos. Los archivos seleccionados permanecen
en la sesión actual; la siguiente versión debe incorporar autenticación, base
de datos y almacenamiento seguro para conservarlos de forma permanente.
