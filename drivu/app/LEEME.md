# Prototipo de Drivu en GitHub Pages

Dirección: https://wentoqleao.github.io/drivu/app/

Es el mismo prototipo con la interfaz final que estaba en Claude. Funciona sin servidor: las cuentas, los viajes y los conductores se simulan en el navegador.

## Buscador de lugares con Google Places

Sin clave, el buscador usa la lista de lugares que trae el prototipo (distritos, hospitales, clínicas, centros comerciales, estaciones y una ubicación aproximada para direcciones que no están en la lista). Con una clave de Google encuentra cualquier lugar o dirección de Lima y Callao.

1. Entra a https://console.cloud.google.com, crea un proyecto y activa la facturación.
2. En "APIs y servicios" activa **Places API (New)**.
3. En "Credenciales" crea una **clave de API** y restríngela:
   - Restricción de aplicación: **Sitios web (referentes HTTP)** → `https://wentoqleao.github.io/*`
   - Restricción de API: solo **Places API (New)**
4. En "Cuotas" pon un tope diario de solicitudes y, en "Facturación", una alerta de presupuesto.
5. Pega la clave en `config.js`: `window.DRIVU_GOOGLE_KEY = 'tu-clave';` y sube el cambio.

La clave se ve en el navegador (así funciona en una página sin servidor), por eso las restricciones del paso 3 son obligatorias. Si Google falla o se llega al tope, el buscador vuelve solo a la lista del prototipo.
