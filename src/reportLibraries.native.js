// Las exportaciones PDF y Excel solo existen en la versión web. Mantener estos
// módulos fuera del bundle nativo evita que Hermes cargue codificaciones web
// no soportadas durante el arranque de Android.
export const jsPDF = null;
export const XLSX = null;
