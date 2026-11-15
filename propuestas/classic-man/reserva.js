/* Classic Man: apertura, idioma ES/EN, abierto ahora (hora de Lima) y reserva que termina en WhatsApp. Sin servidor ni librerías. */
(function () {
  "use strict";
  var root = document.documentElement;
  var body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HOR = JSON.parse(body.dataset.horario || "{}");
  var en = false;
  var tx = function (es, ing) { return en ? ing : es; };

  /* ---------- Apertura: la lámpara de aro se enciende (una vez por visita) ---------- */
  var ap = $("[data-apertura]");
  var listo = function () { root.classList.add("listo"); };
  var vista = false;
  try { vista = !!sessionStorage.getItem("apertura-cm"); sessionStorage.setItem("apertura-cm", "1"); } catch (err) {}
  if (!ap || reduce || vista) {
    if (ap) ap.hidden = true;
    listo();
  } else {
    requestAnimationFrame(function () { ap.classList.add("prende"); });
    var fin = function () {
      if (ap.classList.contains("fuera")) return;
      ap.classList.add("fuera");
      listo();
      setTimeout(function () { ap.hidden = true; }, 600);
    };
    setTimeout(fin, 1750);
    ap.addEventListener("click", fin);
    setTimeout(fin, 4000); /* seguro: nunca bloquea */
  }

  var aviso = $("#aviso");
  function avisar(t) {
    if (!aviso) return;
    aviso.textContent = t; aviso.classList.add("ver");
    clearTimeout(avisar.t); avisar.t = setTimeout(function () { aviso.classList.remove("ver"); }, 2400);
  }

  /* ---------- Hora de Lima ---------- */
  function ahoraLima() {
    var p = {};
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
    } catch (err) { return new Date(); }
  }
  var DIAS = { es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
  var DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var hhmm = function (m) { var h = Math.floor(m / 60), mi = m % 60; return h + ":" + (mi < 10 ? "0" : "") + mi; };
  var ampm = function (h) { return en ? (h > 12 ? h - 12 : h) + " p.m." : (h > 12 ? h - 12 : h) + " p. m."; };

  function estado() {
    var n = ahoraLima(), d = n.getDay(), h = HOR[d], m = n.getHours() * 60 + n.getMinutes();
    var el = $("[data-estado]"), t = $("[data-estado-txt]");
    var fila = $('.horario tr[data-dia="' + d + '"]');
    $$(".horario tr").forEach(function (r) { r.classList.remove("hoy"); });
    if (fila) fila.classList.add("hoy");
    if (!el || !h) return;
    var abierto = m >= h[0] * 60 && m < h[1] * 60;
    el.classList.toggle("abierto", abierto);
    el.classList.toggle("cerrado", !abierto);
    if (abierto) t.textContent = tx("Abierto ahora, cerramos a las " + ampm(h[1]), "Open now, we close at " + ampm(h[1]));
    else if (m < h[0] * 60) t.textContent = tx("Abrimos hoy a las " + h[0] + " a. m.", "We open today at " + h[0] + " a.m.");
    else t.textContent = tx("Cerrado ahora, abrimos mañana a las " + HOR[(d + 1) % 7][0] + " a. m.", "Closed now, we open tomorrow at " + HOR[(d + 1) % 7][0] + " a.m.");
  }

  /* ---------- Idioma ---------- */
  function idioma(ing) {
    en = ing;
    root.lang = en ? "en" : "es";
    $$("[data-en]").forEach(function (el) {
      if (el.dataset.es === undefined) el.dataset.es = el.textContent;
      el.textContent = en ? el.dataset.en : el.dataset.es;
    });
    $$("[data-en-ph]").forEach(function (el) {
      if (el.dataset.esPh === undefined) el.dataset.esPh = el.placeholder;
      el.placeholder = en ? el.dataset.enPh : el.dataset.esPh;
    });
    $$("[data-en-aria]").forEach(function (el) {
      if (el.dataset.esAria === undefined) el.dataset.esAria = el.getAttribute("aria-label");
      el.setAttribute("aria-label", en ? el.dataset.enAria : el.dataset.esAria);
    });
    try { localStorage.setItem("idioma-cm", en ? "en" : "es"); } catch (err) {}
    estado(); pintarDias(); pintarHoras(); resumen();
  }
  var bIdioma = $("[data-idioma]");
  if (bIdioma) bIdioma.addEventListener("click", function () { idioma(!en); });

  /* ---------- Reserva ---------- */
  var form = $("#form-res");
  var diaSel = null, horaSel = null;
  var cajaDias = $("#dias"), cajaHoras = $("#horas");

  function proximos() {
    var n = ahoraLima(), out = [];
    for (var i = 0; i < 7; i++) {
      var f = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i);
      out.push(f);
    }
    return out;
  }
  function turnos(f) {
    var h = HOR[f.getDay()], n = ahoraLima(), lista = [];
    var hoy = f.toDateString() === n.toDateString();
    var minimo = hoy ? n.getHours() * 60 + n.getMinutes() + 30 : 0;
    for (var m = h[0] * 60; m <= h[1] * 60 - 45; m += 30) if (m >= minimo) lista.push(m);
    return lista;
  }
  function radio(cont, valor, l1, l2, sel, alElegir) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "chip-b"; b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", sel ? "true" : "false");
    b.tabIndex = sel ? 0 : -1;
    var a = document.createElement("span"); a.textContent = l1; b.appendChild(a);
    if (l2) { var s = document.createElement("small"); s.textContent = l2; b.appendChild(s); }
    b.addEventListener("click", function () { alElegir(valor); });
    b.addEventListener("keydown", function (ev) {
      var hs = $$(".chip-b", cont), i = hs.indexOf(b);
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") { ev.preventDefault(); (hs[i + 1] || hs[0]).focus(); }
      if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") { ev.preventDefault(); (hs[i - 1] || hs[hs.length - 1]).focus(); }
    });
    cont.appendChild(b);
  }
  function pintarDias() {
    if (!cajaDias) return;
    cajaDias.textContent = "";
    var ds = proximos().filter(function (f) { return turnos(f).length; });
    if (!diaSel || !ds.some(function (f) { return f.toDateString() === diaSel.toDateString(); })) diaSel = ds[0];
    var hoy = ahoraLima().toDateString();
    var algunoFoco = false;
    ds.forEach(function (f, i) {
      var esHoy = f.toDateString() === hoy;
      var manana = new Date(ahoraLima().getFullYear(), ahoraLima().getMonth(), ahoraLima().getDate() + 1).toDateString() === f.toDateString();
      var l1 = esHoy ? tx("Hoy", "Today") : manana ? tx("Mañana", "Tomorrow") : DIAS[en ? "en" : "es"][f.getDay()];
      var sel = diaSel && f.toDateString() === diaSel.toDateString();
      radio(cajaDias, f, l1, f.getDate() + "/" + (f.getMonth() + 1), sel, function (v) { diaSel = v; horaSel = null; pintarDias(); pintarHoras(); resumen(); $(".chip-b[aria-checked=true]", cajaDias).focus(); });
      if (sel) algunoFoco = true;
    });
    if (!algunoFoco && cajaDias.firstChild) cajaDias.firstChild.tabIndex = 0;
  }
  function pintarHoras() {
    if (!cajaHoras) return;
    cajaHoras.textContent = "";
    cajaHoras.setAttribute("role", "radiogroup");
    cajaHoras.setAttribute("aria-label", tx("Hora", "Time"));
    var ts = diaSel ? turnos(diaSel) : [];
    $("#sin-horas").hidden = !!ts.length;
    if (horaSel !== null && ts.indexOf(horaSel) < 0) horaSel = null;
    ts.forEach(function (m) {
      radio(cajaHoras, m, hhmm(m), "", m === horaSel, function (v) { horaSel = v; $("#err-hora").hidden = true; pintarHoras(); resumen(); var s = $(".chip-b[aria-checked=true]", cajaHoras); if (s) s.focus(); });
    });
    if (horaSel === null && cajaHoras.firstChild) cajaHoras.firstChild.tabIndex = 0;
  }
  function servicios() {
    return $$('input[name="servicio"]:checked').map(function (i) { return i; });
  }
  function resumen() {
    var r = $("#resumen");
    if (!r) return;
    var s = servicios().map(function (i) { return en ? i.dataset.enVal : i.dataset.es; });
    var partes = [];
    if (s.length) partes.push(s.join(" + "));
    if (diaSel) partes.push(en ? DIAS.en[diaSel.getDay()] + " " + diaSel.getDate() + "/" + (diaSel.getMonth() + 1)
                                 : DIAS_L[diaSel.getDay()] + " " + diaSel.getDate() + "/" + (diaSel.getMonth() + 1));
    if (horaSel !== null) partes.push(hhmm(horaSel));
    r.textContent = partes.length ? partes.join(", ") : tx("Elige servicio, día y hora.", "Pick service, day and time.");
  }

  $$('input[name="servicio"]').forEach(function (i) { i.addEventListener("change", function () { $("#err-serv").hidden = true; resumen(); }); });

  /* Botón "Reservar" de cada servicio: lo marca y baja al formulario */
  $$("[data-elegir]").forEach(function (b) {
    b.addEventListener("click", function () {
      var i = $('input[name="servicio"][value="' + b.dataset.elegir + '"]');
      if (i) { i.checked = true; resumen(); }
      var sec = $("#reservar");
      if (sec) sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(function () { var d = $(".chip-b[aria-checked=true]", cajaDias); if (d) d.focus({ preventScroll: true }); }, reduce ? 0 : 500);
    });
  });

  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var s = servicios(), nombre = $("#nombre").value.trim(), ok = true, primero = null;
    $("#err-serv").hidden = !!s.length; if (!s.length) { ok = false; primero = primero || $('input[name="servicio"]'); }
    $("#err-hora").hidden = horaSel !== null; if (horaSel === null) { ok = false; primero = primero || $(".chip-b", cajaHoras) || $(".chip-b", cajaDias); }
    $("#err-nombre").hidden = !!nombre; $("#nombre").setAttribute("aria-invalid", nombre ? "false" : "true");
    if (!nombre) { ok = false; primero = primero || $("#nombre"); }
    if (!ok) { if (primero) primero.focus(); return; }
    var barbero = $("#barbero").value.trim(), nota = $("#nota").value.trim();
    var txt = "Hola " + body.dataset.local + ", quiero reservar un turno.\n" +
      "Servicio: " + s.map(function (i) { return i.dataset.es; }).join(" + ") + "\n" +
      "Día: " + DIAS_L[diaSel.getDay()] + " " + diaSel.getDate() + "/" + (diaSel.getMonth() + 1) + "\n" +
      "Hora: " + hhmm(horaSel) + "\n" +
      "Nombre: " + nombre +
      (barbero ? "\nBarbero: " + barbero : "") +
      (nota ? "\nNota: " + nota : "") +
      (en ? "\n(El cliente prefiere que le escriban en inglés)" : "");
    var url = "https://wa.me/" + body.dataset.wa + "?text=" + encodeURIComponent(txt);
    /* window.open con noopener devuelve null aunque abra: se usa un enlace para no perder la página */
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    document.body.appendChild(a); a.click(); a.remove();
    avisar(tx("Abriendo WhatsApp con tu reserva", "Opening WhatsApp with your booking"));
  });

  var guardado = "es";
  try { guardado = localStorage.getItem("idioma-cm") || "es"; } catch (err) {}
  if (guardado === "en") idioma(true); else { estado(); pintarDias(); pintarHoras(); resumen(); }
  setInterval(estado, 60000);
})();
