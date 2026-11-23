// Sencillo para Scriptable: registra gastos e ingresos y muestra tu saldo en un widget.
// Tus datos se guardan en iCloud Drive > Scriptable > sencillo-datos.json (solo en tu cuenta).
//
// Cómo usarlo:
//  - Toca el widget o ejecuta el script: te pregunta ¿De cuánto?, ¿En qué fue? y ¿Qué categoría?
//  - Desde un Atajo o un enlace: scriptable:///run/Sencillo?add=gasto&monto=12.50&nota=Menú&cat=Comida
//    (también acepta add=ingreso y &cuenta=Yape)

const CONFIG = {
  moneda: 'S/',
  cuentas: ['Efectivo', 'Yape', 'Plin', 'BCP', 'Interbank'],
  catGasto: ['Comida', 'Transporte', 'Casa', 'Servicios', 'Salud', 'Salidas', 'Compras', 'Educación', 'Otros'],
  catIngreso: ['Sueldo', 'Freelance', 'Ventas', 'Otros ingresos'],
  // Saldo con el que empiezas en cada cuenta (opcional), p. ej. { Yape: 150, BCP: 1200 }
  saldoInicial: {},
};

const COLORES = {
  fondo1: new Color('#0f2a5c'),
  fondo2: new Color('#163d82'),
  texto: Color.white(),
  suave: new Color('#ffffff', 0.7),
  oro: new Color('#f5c542'),
  rojo: new Color('#ff8a80'),
  verde: new Color('#7ee2a8'),
};

const fm = FileManager.iCloud();
const ARCHIVO = fm.joinPath(fm.documentsDirectory(), 'sencillo-datos.json');

// ---------- datos ----------
async function cargar() {
  if (!fm.fileExists(ARCHIVO)) return { version: 1, movs: [] };
  try {
    await fm.downloadFileFromiCloud(ARCHIVO);
    const d = JSON.parse(fm.readString(ARCHIVO));
    if (!Array.isArray(d.movs)) d.movs = [];
    return d;
  } catch (e) {
    return { version: 1, movs: [] };
  }
}

function guardar(datos) {
  fm.writeString(ARCHIVO, JSON.stringify(datos, null, 1));
}

function hoy() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function parseMonto(v) {
  if (typeof v === 'number') return v;
  let s = String(v || '').replace(/[^\d.,-]/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isFinite(n) ? Math.round(Math.abs(n) * 100) / 100 : NaN;
}

function elegir(lista, valor, porDefecto) {
  if (!valor) return porDefecto;
  const v = String(valor).trim().toLowerCase();
  return lista.find((x) => x.toLowerCase() === v) || porDefecto;
}

function soles(n) {
  const neg = n < 0;
  const [e, d] = Math.abs(n).toFixed(2).split('.');
  return (neg ? '-' : '') + CONFIG.moneda + ' ' + e.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + d;
}

function resumen(movs) {
  const mes = hoy().slice(0, 7);
  let saldo = Object.values(CONFIG.saldoInicial).reduce((a, b) => a + (+b || 0), 0);
  let gastoMes = 0, ingresoMes = 0;
  for (const m of movs) {
    const signo = m.tipo === 'ingreso' ? 1 : -1;
    saldo += signo * m.monto;
    if (m.fecha.startsWith(mes)) {
      if (m.tipo === 'ingreso') ingresoMes += m.monto; else gastoMes += m.monto;
    }
  }
  return { saldo, gastoMes, ingresoMes };
}

function nuevoMov({ tipo, monto, nota, cat, cuenta }) {
  const esIngreso = tipo === 'ingreso';
  const cats = esIngreso ? CONFIG.catIngreso : CONFIG.catGasto;
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    tipo: esIngreso ? 'ingreso' : 'gasto',
    monto,
    nota: (nota || '').trim(),
    cat: elegir(cats, cat, esIngreso ? 'Otros ingresos' : 'Otros'),
    cuenta: elegir(CONFIG.cuentas, cuenta, CONFIG.cuentas[0]),
    fecha: hoy(),
    origen: 'scriptable',
    creado: new Date().toISOString(),
  };
}

// ---------- preguntas ----------
async function preguntarTexto(titulo, numerico) {
  const a = new Alert();
  a.title = titulo;
  const campo = a.addTextField(numerico ? '0.00' : '', '');
  if (numerico && campo && campo.setDecimalPadKeyboard) campo.setDecimalPadKeyboard();
  a.addAction('Siguiente');
  a.addCancelAction('Cancelar');
  const r = await a.presentAlert();
  if (r === -1) return null;
  return a.textFieldValue(0);
}

async function preguntarLista(titulo, opciones) {
  const a = new Alert();
  a.title = titulo;
  for (const o of opciones) a.addAction(o);
  a.addCancelAction('Cancelar');
  const r = await a.presentSheet();
  return r === -1 ? null : opciones[r];
}

async function avisar(titulo, mensaje) {
  const a = new Alert();
  a.title = titulo;
  a.message = mensaje;
  a.addAction('OK');
  await a.present();
}

async function registrarInteractivo(datos, tipo) {
  const montoTxt = await preguntarTexto('¿De cuánto?', true);
  if (montoTxt === null) return false;
  const monto = parseMonto(montoTxt);
  if (!(monto > 0)) { await avisar('Monto no válido', 'Escribe un número, por ejemplo 12.50'); return false; }
  const nota = await preguntarTexto('¿En qué fue?', false);
  if (nota === null) return false;
  const cats = tipo === 'ingreso' ? CONFIG.catIngreso : CONFIG.catGasto;
  const cat = await preguntarLista('¿Qué categoría?', cats);
  if (cat === null) return false;
  const cuenta = await preguntarLista('¿Con qué pagaste?', CONFIG.cuentas);
  if (cuenta === null) return false;
  const m = nuevoMov({ tipo, monto, nota, cat, cuenta });
  datos.movs.push(m);
  guardar(datos);
  const r = resumen(datos.movs);
  await avisar('Guardado ✓', `${m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} de ${soles(m.monto)} en ${m.cat}.\nSaldo: ${soles(r.saldo)}`);
  return true;
}

async function verUltimos(datos) {
  const t = new UITable();
  t.showSeparators = true;
  const ult = datos.movs.slice(-30).reverse();
  if (!ult.length) {
    const row = new UITableRow();
    row.addText('Todavía no hay movimientos');
    t.addRow(row);
  }
  for (const m of ult) {
    const row = new UITableRow();
    row.height = 56;
    const izq = row.addText(m.nota || m.cat, `${m.fecha} · ${m.cat} · ${m.cuenta}`);
    izq.widthWeight = 70;
    const der = row.addText((m.tipo === 'ingreso' ? '+' : '-') + soles(m.monto));
    der.widthWeight = 30;
    der.rightAligned();
    der.titleColor = m.tipo === 'ingreso' ? Color.green() : Color.red();
    row.dismissOnSelect = false;
    row.onSelect = async () => {
      const a = new Alert();
      a.title = '¿Borrar este movimiento?';
      a.message = `${m.nota || m.cat} · ${soles(m.monto)}`;
      a.addDestructiveAction('Borrar');
      a.addCancelAction('Cancelar');
      if ((await a.presentAlert()) === 0) {
        datos.movs = datos.movs.filter((x) => x.id !== m.id);
        guardar(datos);
        await avisar('Borrado', 'Vuelve a abrir la lista para verla actualizada.');
      }
    };
    t.addRow(row);
  }
  await t.present();
}

function csv(datos) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const filas = [['fecha', 'tipo', 'monto', 'categoria', 'cuenta', 'nota'].join(',')];
  for (const m of datos.movs) filas.push([m.fecha, m.tipo, m.monto.toFixed(2), m.cat, m.cuenta, m.nota].map(esc).join(','));
  return filas.join('\n');
}

async function menu(datos) {
  const r = resumen(datos.movs);
  const a = new Alert();
  a.title = 'Sencillo';
  a.message = `Saldo: ${soles(r.saldo)}\nGastado este mes: ${soles(r.gastoMes)}\nIngresos del mes: ${soles(r.ingresoMes)}`;
  a.addAction('Registrar gasto');
  a.addAction('Registrar ingreso');
  a.addAction('Ver últimos movimientos');
  a.addAction('Exportar CSV');
  a.addCancelAction('Cerrar');
  const op = await a.presentSheet();
  if (op === 0) await registrarInteractivo(datos, 'gasto');
  else if (op === 1) await registrarInteractivo(datos, 'ingreso');
  else if (op === 2) await verUltimos(datos);
  else if (op === 3) {
    const ruta = fm.joinPath(fm.documentsDirectory(), `sencillo-${hoy()}.csv`);
    fm.writeString(ruta, csv(datos));
    await ShareSheet.present([ruta]);
  }
}

// ---------- widget ----------
function crearWidget(datos) {
  const r = resumen(datos.movs);
  const familia = config.widgetFamily || 'small';
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [COLORES.fondo1, COLORES.fondo2];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(14, 14, 14, 14);
  w.url = URLScheme.forRunningScript() + '?accion=gasto';

  if (familia === 'accessoryInline') {
    w.addText(`${soles(r.saldo)} · mes -${soles(r.gastoMes)}`);
    return w;
  }
  if (familia === 'accessoryRectangular' || familia === 'accessoryCircular') {
    const t1 = w.addText('Saldo');
    t1.font = Font.mediumSystemFont(11);
    const t2 = w.addText(soles(r.saldo));
    t2.font = Font.boldSystemFont(15);
    t2.minimumScaleFactor = 0.5;
    if (familia === 'accessoryRectangular') {
      const t3 = w.addText(`Mes: -${soles(r.gastoMes)}`);
      t3.font = Font.systemFont(11);
    }
    return w;
  }

  const cab = w.addText('SENCILLO');
  cab.font = Font.boldSystemFont(11);
  cab.textColor = COLORES.oro;
  w.addSpacer(6);

  const lb = w.addText('Saldo');
  lb.font = Font.mediumSystemFont(12);
  lb.textColor = COLORES.suave;
  const sal = w.addText(soles(r.saldo));
  sal.font = Font.boldSystemFont(familia === 'small' ? 22 : 26);
  sal.textColor = r.saldo < 0 ? COLORES.rojo : COLORES.texto;
  sal.minimumScaleFactor = 0.5;
  sal.lineLimit = 1;
  if (familia === 'large') w.addSpacer(14); else w.addSpacer();

  const fila = w.addStack();
  fila.layoutHorizontally();
  const col = (titulo, valor, color) => {
    const s = fila.addStack();
    s.layoutVertically();
    const a = s.addText(titulo);
    a.font = Font.mediumSystemFont(10);
    a.textColor = COLORES.suave;
    const b = s.addText(valor);
    b.font = Font.semiboldSystemFont(13);
    b.textColor = color;
    b.minimumScaleFactor = 0.6;
    b.lineLimit = 1;
  };
  col('Gastado mes', soles(r.gastoMes), COLORES.rojo);
  if (familia !== 'small') {
    fila.addSpacer();
    col('Ingresos mes', soles(r.ingresoMes), COLORES.verde);
  }

  if (familia === 'large') {
    w.addSpacer(10);
    for (const m of datos.movs.slice(-5).reverse()) {
      const s = w.addStack();
      s.layoutHorizontally();
      const n = s.addText(m.nota || m.cat);
      n.font = Font.systemFont(12);
      n.textColor = COLORES.texto;
      n.lineLimit = 1;
      s.addSpacer();
      const v = s.addText((m.tipo === 'ingreso' ? '+' : '-') + soles(m.monto));
      v.font = Font.semiboldSystemFont(12);
      v.textColor = m.tipo === 'ingreso' ? COLORES.verde : COLORES.rojo;
      w.addSpacer(3);
    }
  }

  if (familia === 'large') w.addSpacer(); else w.addSpacer(6);
  const pie = w.addText('Toca para registrar');
  pie.font = Font.systemFont(9);
  pie.textColor = COLORES.suave;
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  return w;
}

// ---------- inicio ----------
const datos = await cargar();
const q = args.queryParameters || {};
const sp = args.shortcutParameter && typeof args.shortcutParameter === 'object' ? args.shortcutParameter : {};
const p = Object.assign({}, sp, q);

if (config.runsInWidget) {
  Script.setWidget(crearWidget(datos));
} else if (p.add && p.monto) {
  // Registro directo desde un Atajo o enlace
  const monto = parseMonto(p.monto);
  if (monto > 0) {
    const m = nuevoMov({ tipo: p.add, monto, nota: p.nota, cat: p.cat, cuenta: p.cuenta });
    datos.movs.push(m);
    guardar(datos);
    const r = resumen(datos.movs);
    const msg = `${m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} de ${soles(m.monto)} en ${m.cat}. Saldo: ${soles(r.saldo)}`;
    if (config.runsInApp) await avisar('Guardado ✓', msg);
    Script.setShortcutOutput(msg);
  } else {
    Script.setShortcutOutput('Monto no válido');
  }
} else if (config.runsInApp && (p.accion === 'gasto' || p.accion === 'ingreso')) {
  await registrarInteractivo(datos, p.accion);
} else if (config.runsInApp) {
  await menu(datos);
} else {
  // Vista previa (por ejemplo, desde Siri)
  await crearWidget(datos).presentMedium();
}
Script.complete();
