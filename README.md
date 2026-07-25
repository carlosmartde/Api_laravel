# Refinery Import

Aplicación móvil multiplataforma creada con React Native y Expo para controlar
importaciones de materiales y equipos destinados a una refinería.

## Funcionalidades

- Panel general de embarques, alertas y materiales pendientes de ubicar.
- Seguimiento marítimo por buque, origen, ETA, progreso e Incoterm.
- Control aduanal con documentos, observaciones y costos estimados.
- Inventario interno por código, cantidad y ubicación en la refinería.
- Detalle del embarque con línea de tiempo y destino del material.
- Búsqueda, filtros, alertas de stock y formulario modal de recepción.

## Pantallas y componentes

1. **Inicio:** `ScrollView`, `View`, `Text`, `TouchableOpacity` e iconos.
2. **Embarques:** `FlatList`, `TextInput`, `TouchableOpacity`, `View` e iconos.
3. **Aduanas:** `ScrollView`, `Switch`, `TouchableOpacity`, `View` e iconos.
4. **Inventario:** `FlatList`, `TextInput`, `Modal`, `Pressable` e iconos.
5. **Detalle:** `ScrollView`, `TouchableOpacity`, `View`, `Text` e iconos.

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

Los datos son demostrativos y permanecen en memoria. En una siguiente versión
se puede conectar autenticación, GPS/AIS para buques, lectura real de códigos,
notificaciones y una base de datos.
