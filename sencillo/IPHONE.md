# Sencillo en el iPhone

Con esto tienes Sencillo como ícono en tu pantalla de inicio y un Atajo que te pregunta **¿De cuánto?**, **¿En qué fue?** y **¿Qué categoría?**, y guarda el gasto al instante.

Dirección de la app: `https://josewql07.github.io/sencillo/`

## 1. Ícono en la pantalla de inicio

1. Abre la dirección de arriba en **Safari**.
2. Toca **Compartir** y luego **Añadir a pantalla de inicio**.
3. Si aparece la opción **Abrir como app web**, **desactívala**. Así el ícono y el Atajo usan los mismos datos.
4. Toca **Añadir**.

## 2. Atajo de registro rápido

Abre la app **Atajos**, toca **+** y agrega estas acciones en orden:

1. **Solicitar entrada**: tipo *Número*, pregunta `¿De cuánto?`
2. **Solicitar entrada**: tipo *Texto*, pregunta `¿En qué fue?`
3. **Codificar URL**: con la *Entrada proporcionada* del paso 2.
4. **Lista**: escribe tus categorías, una por línea, igual que en Sencillo:
   `Comida`, `Transporte`, `Casa`, `Servicios`, `Salud`, `Salidas`, `Compras`, `Educación`, `Otros`
5. **Elegir de la lista**: pregunta `¿Qué categoría?`
6. **URL**: escribe esto e inserta las variables donde están los corchetes:
   `https://josewql07.github.io/sencillo/?add=gasto&monto=[Entrada del paso 1]&nota=[Texto codificado del paso 3]&cat=[Elemento elegido]`
7. **Abrir URL**.

Ponle de nombre **Gasto** y elige un ícono.

### Opcional

- **Cuenta**: agrega otra *Lista* con `Efectivo`, `Yape`, `Plin`, `BCP`, `Interbank`, otro *Elegir de la lista* y suma `&cuenta=[Elemento elegido]` al final de la URL. Si no la pones, se usa la primera cuenta.
- **Ingresos**: duplica el atajo, cambia `add=gasto` por `add=ingreso` y usa tus categorías de ingreso (`Sueldo`, `Freelance`, `Ventas`, `Otros ingresos`).

## 3. Dónde lanzar el Atajo

- **Pantalla de inicio**: en Atajos, mantén presionado el atajo, toca **Compartir** y luego **Añadir a pantalla de inicio**.
- **Widget**: mantén presionada la pantalla de inicio, toca **Editar** y luego **Añadir widget**, y elige **Atajos**. Queda un botón para registrar con un toque.
- **Botón de acción** (iPhone 15 Pro o más nuevo): *Ajustes > Botón de acción > Atajo > Gasto*.
- **Tocar atrás**: *Ajustes > Accesibilidad > Tocar > Tocar atrás > Doble toque > Gasto*.
- **Siri**: di "Oye Siri, Gasto".

## 4. Widget con tu saldo (gratis, con Scriptable)

Abre `https://josewql07.github.io/sencillo/widget.html` en el iPhone, toca **Copiar código** y sigue los pasos: instalas **Scriptable** (gratis), pegas el script con el nombre `Sencillo` y añades el widget de Scriptable a tu pantalla de inicio.

- El widget muestra tu saldo, lo gastado y lo ingresado en el mes (el grande también muestra los últimos movimientos).
- Al tocarlo te pregunta ¿De cuánto?, ¿En qué fue?, ¿Qué categoría? y con qué pagaste.
- Para Siri o el botón de acción: Atajo con **Abrir URL** `scriptable:///run/Sencillo?accion=gasto`.
- Los datos del widget se guardan en iCloud Drive (*Scriptable › sencillo-datos.json*), separados de los de Safari.

## Otros enlaces útiles

- `…/sencillo/?nuevo=gasto`: abre directo el formulario de gasto.
- `…/sencillo/?nuevo=ingreso`: abre directo el formulario de ingreso.
- `…/sencillo/?nuevo=comprobante`: abre directo **Leer comprobante** para pegar un Yape o Plin.

## Importante sobre tus datos

- Fuera de Claude, los datos se guardan solo en Safari de tu iPhone. No se suben a internet ni a este repositorio.
- Safari puede borrar datos de sitios que no abres en varias semanas. Si usas la app seguido no pasa, pero conviene descargar un respaldo de vez en cuando desde **Cuentas > Descargar CSV**.
- Estos datos son distintos de los que tienes en la versión de Claude.
