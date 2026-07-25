# Instrucciones para principiantes

## 1. Dónde está guardado

La carpeta completa `RefineryImportApp` **es el proyecto**. No muevas solamente
`App.js`: conserva juntos todos los archivos.

Puedes copiar la carpeta a OneDrive, Google Drive o una memoria USB como
respaldo. No necesitas guardar la carpeta `node_modules`; se vuelve a generar
con `npm install`.

## 2. Abrirlo en Visual Studio Code

1. Abre Visual Studio Code.
2. Selecciona **Archivo > Abrir carpeta**.
3. Elige la carpeta `RefineryImportApp`.
4. En VS Code selecciona **Terminal > Nueva terminal**.

## 3. Primera ejecución

Escribe cada comando y presiona Enter:

```powershell
npm install
npx expo start
```

La primera instalación puede tardar varios minutos. No cierres la terminal.

## 4. Detener y volver a abrir

- Para detener Expo presiona `Ctrl + C`.
- Otro día, abre de nuevo la misma carpeta y ejecuta solamente
  `npx expo start`.

## 5. Errores comunes

- **`npm` no se reconoce:** instala Node.js LTS y reinicia VS Code.
- **El QR no conecta:** verifica el mismo Wi-Fi o usa
  `npx expo start --tunnel`.
- **Pantalla desactualizada:** en la terminal presiona `r`.
- **Error después de cambiar dependencias:** ejecuta
  `npx expo start --clear`.

## 6. Entrega

Antes de comprimir el proyecto, elimina o excluye `node_modules` para que el ZIP
sea pequeño. Entrega el resto de la carpeta y el archivo `README.md`.
