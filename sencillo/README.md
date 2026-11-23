# Sencillo

Control personal de ingresos y gastos en soles (S/), pensado para Perú.

## Qué hace

- Registro rápido de gastos e ingresos por categoría y cuenta (Efectivo, Yape, Plin, BCP, Interbank y las que agregues).
- Resumen del mes: cuánto te queda, ingresos, gastos, gastos por categoría y saldo por cuenta.
- Presupuesto con tope por categoría (avisa en ámbar y rojo).
- Metas de ahorro y gastos o ingresos fijos que se repiten cada mes.
- Lectura de comprobantes: pegas el texto de una notificación de Yape, Plin o tu banco y se convierte en un movimiento para revisar.
- Gráfica de los últimos 6 meses y exportación a CSV.

## Cómo se guardan los datos

- Abierta como página normal (GitHub Pages o el archivo local), funciona en **modo local**: los datos se guardan solo en el navegador (`localStorage`) del dispositivo donde la usas.
- Dentro de Claude (artifact), guarda los datos en la nube de forma privada y además permite leer capturas de comprobantes con IA.

## En el iPhone

Ícono en la pantalla de inicio y Atajo de registro rápido (¿De cuánto?, ¿En qué fue?, ¿Qué categoría?): ver [IPHONE.md](IPHONE.md).

## Uso

Es un solo archivo HTML sin dependencias de build. Abre `index.html` en el navegador o visita `/sencillo/` en el sitio.

- Android: ver [ANDROID.md](ANDROID.md) (se instala como app desde Chrome y funciona sin internet).
