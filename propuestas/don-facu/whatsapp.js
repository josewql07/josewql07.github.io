/* Pedidos y reservas que terminan en WhatsApp. Sin servidor.
   El número sale de <body data-wa="51...">; el local, de data-local; el pedido mínimo, de data-min (opcional).
   Opciones por plato (extras, a elegir): <script type="application/json" id="opciones-carta">.
   Horario de pedidos (hora de Lima): data-dias / data-desde / data-hasta en #bolsa-form. */
(function () {
  "use strict";
  var body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var soles = function (n) { return "S/ " + n.toFixed(2); };
  var el = function (tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  var aviso = $("#aviso");
  var avisar = function (t) {
    if (!aviso) return;
    aviso.textContent = t;
    aviso.classList.add("ver");
    clearTimeout(avisar.t);
    avisar.t = setTimeout(function () { aviso.classList.remove("ver"); }, 2200);
  };
  var abrirWa = function (texto) {
    var url = "https://wa.me/" + body.dataset.wa + "?text=" + encodeURIComponent(texto);
    // Con "noopener" el navegador devuelve null aunque abra la pestaña, y la página se iba a WhatsApp dos veces.
    var w = window.open(url, "_blank");
    if (w) { try { w.opener = null; } catch (e) {} } else location.href = url;
  };
  /* Mensajes dentro del formulario (el aviso flotante queda detrás de las ventanas) */
  var mensajeEn = function (form, cls) {
    var m = $("." + cls, form);
    if (!m) {
      m = el("p", cls); m.setAttribute("role", cls === "f-ok" ? "status" : "alert"); m.hidden = true;
      var boton = $("[type=submit]", form); form.insertBefore(m, boton);
    }
    return m;
  };
  var marcarError = function (form, campo, texto) {
    var m = mensajeEn(form, "f-err");
    m.textContent = texto; m.hidden = false;
    var ok = $(".f-ok", form); if (ok) ok.hidden = true;
    if (campo) {
      campo.setAttribute("aria-invalid", "true");
      campo.focus();
      campo.addEventListener("input", function limpiar() { campo.removeAttribute("aria-invalid"); m.hidden = true; campo.removeEventListener("input", limpiar); });
    }
  };

  /* Hora de Lima, sin importar dónde esté el celular del cliente */
  function ahoraLima() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return new Date(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    } catch (err) { return new Date(); }
  }
  var aMin = function (hhmm) { var x = hhmm.split(":"); return +x[0] * 60 + +x[1]; };
  var aHora = function (m) { return ("0" + Math.floor(m / 60)).slice(-2) + ":" + ("0" + (m % 60)).slice(-2); };

  /* ---------- Pedido ---------- */
  var bolsa = $("#bolsa");
  var items = [];
  var KEY = "pedido-" + (body.dataset.slug || "demo");
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { items = []; }
  var guardar = function () { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (err) {} };
  var total = function () { return items.reduce(function (a, i) { return a + i.p * i.q; }, 0); };
  var cuenta = function () { return items.reduce(function (a, i) { return a + i.q; }, 0); };
  var clave = function (i) { return i.n + "|" + (i.o || []).join(",") + "|" + (i.nota || ""); };

  function sumar(nuevo) {
    var k = clave(nuevo);
    var it = items.filter(function (i) { return clave(i) === k; })[0];
    if (it) it.q += nuevo.q; else items.push(nuevo);
    guardar(); pintar();
    avisar("Agregado: " + (nuevo.q > 1 ? nuevo.q + " × " : "") + nuevo.n);
  }

  function pintar() {
    $$("[data-cuenta]").forEach(function (e) { e.textContent = cuenta(); });
    $$("[data-total]").forEach(function (e) { e.textContent = soles(total()); });
    $$("[data-con-items]").forEach(function (e) { e.hidden = !items.length; });
    $$("[data-sin-items]").forEach(function (e) { e.hidden = !!items.length; });
    var lista = $("#bolsa-items");
    if (!lista) return;
    lista.textContent = "";
    if (!items.length) lista.appendChild(el("li", "vacio", "Aún no agregas nada. Elige en la carta con el botón +."));
    items.forEach(function (it, k) {
      var li = el("li");
      var n = el("span", "b-nombre", it.n);
      var extra = (it.o || []).slice();
      if (it.nota) extra.push("“" + it.nota + "”");
      if (extra.length) n.appendChild(el("small", "b-ops", extra.join(" · ")));
      var c = el("span", "b-cant");
      var menos = el("button", null, "−"); menos.type = "button"; menos.setAttribute("aria-label", "Quitar uno de " + it.n);
      var q = el("output", null, it.q);
      var mas = el("button", null, "+"); mas.type = "button"; mas.setAttribute("aria-label", "Agregar uno de " + it.n);
      menos.addEventListener("click", function () { it.q--; if (it.q < 1) items.splice(k, 1); guardar(); pintar(); });
      mas.addEventListener("click", function () { it.q++; guardar(); pintar(); });
      c.append(menos, q, mas);
      li.append(n, c, el("span", "b-precio", soles(it.p * it.q)));
      lista.appendChild(li);
    });
    var min = parseFloat(body.dataset.min || "0");
    var falta = $("#bolsa-minimo");
    if (falta) {
      var modo = ($("input[name=modo]:checked", bolsa) || {}).value;
      var corto = min && modo === "delivery" && total() < min;
      falta.hidden = !corto;
      if (corto) falta.textContent = "El pedido mínimo para delivery es " + soles(min) + ". Te faltan " + soles(min - total()) + ".";
    }
  }

  /* ---------- Ficha del plato: extras y opciones antes de agregar ---------- */
  var reglas = [];
  try { reglas = (JSON.parse(($("#opciones-carta") || {}).textContent || "{}").reglas) || []; } catch (err) { reglas = []; }

  function opcionesDe(b) {
    var n = b.dataset.nombre, grupos = [];
    reglas.forEach(function (r) {
      var porLugar = r.en && b.closest(r.en);
      var porNombre = r.nombre && new RegExp(r.nombre, "i").test(n);
      if (!porLugar && !porNombre) return;
      if (r.excepto && new RegExp(r.excepto, "i").test(n)) return;
      r.grupos.forEach(function (g) {
        var ops = g.ops ? g.ops.map(function (o) { return typeof o === "string" ? { n: o, p: 0 } : o; }) : [];
        if (g.desde) {
          var filtro = g.filtro ? new RegExp(g.filtro, "i") : null;
          var vistos = {};
          $$(g.desde + " [data-add]").forEach(function (x) {
            var xn = x.dataset.nombre;
            if (vistos[xn] || xn === n || (filtro && !filtro.test(xn))) return;
            vistos[xn] = 1;
            ops.push({ n: xn, p: parseFloat(x.dataset.precio) });
          });
        }
        if (ops.length) grupos.push({ t: g.t, tipo: g.tipo || "varios", min: g.min || 0, max: g.max || 0, ops: ops });
      });
    });
    return grupos;
  }

  var ficha = null;
  function crearFicha() {
    ficha = el("dialog", "bolsa ficha");
    ficha.id = "ficha";
    ficha.setAttribute("aria-labelledby", "t-ficha");
    var cab = el("div", "b-cab");
    var h = el("h2", null, ""); h.id = "t-ficha";
    var x = el("button", "cerrar", "×"); x.type = "button"; x.setAttribute("aria-label", "Cerrar");
    x.addEventListener("click", function () { ficha.close(); });
    cab.append(h, x);
    ficha.appendChild(cab);
    ficha.addEventListener("click", function (ev) { if (ev.target === ficha) ficha.close(); });
    document.body.appendChild(ficha);
  }

  function abrirFicha(b, grupos, card) {
    if (!ficha) crearFicha();
    $("#t-ficha", ficha).textContent = b.dataset.nombre;
    $$(".f-foto, .form", ficha).forEach(function (e) { e.remove(); });
    var base = parseFloat(b.dataset.precio);
    var img = card && $("img", card);
    if (img) {
      var f = el("img", "f-foto");
      f.src = img.currentSrc || img.src; f.alt = ""; f.width = img.width; f.height = img.height;
      ficha.appendChild(f);
    }
    var form = el("form", "form f-form");
    form.noValidate = true;
    var desc = card && $("p:not(.fila)", card);
    var info = el("p", "f-base", "");
    info.textContent = (desc ? desc.textContent.trim() + " · " : "") + soles(base);
    form.appendChild(info);

    grupos.forEach(function (g, gi) {
      var fs = el("fieldset", "modo f-grupo");
      var reglaTxt = g.tipo === "uno" ? "elige una" : g.min ? "elige " + g.min : g.max ? "hasta " + g.max + ", opcional" : "opcional";
      var lg = el("legend", null, g.t + " ");
      lg.appendChild(el("small", null, reglaTxt));
      fs.appendChild(lg);
      g.ops.forEach(function (o, oi) {
        var lab = el("label");
        var inp = el("input");
        inp.type = g.tipo === "uno" ? "radio" : "checkbox";
        inp.name = "g" + gi; inp.value = oi;
        if (g.tipo === "uno" && oi === 0) inp.checked = true;
        lab.append(inp, el("span", null, o.n));
        if (o.p) lab.appendChild(el("span", "f-precio", "+ " + soles(o.p)));
        fs.appendChild(lab);
      });
      form.appendChild(fs);
    });
    var err = el("p", "r-error f-error"); err.hidden = true; err.setAttribute("role", "alert");
    var nota = el("label", null, "Nota para este plato (opcional)");
    var ni = el("input"); ni.name = "nota"; ni.placeholder = "Sin cebolla, ají aparte…"; ni.maxLength = 80;
    nota.appendChild(ni);
    var pie = el("div", "f-pie");
    var cant = el("span", "b-cant");
    var menos = el("button", null, "−"); menos.type = "button"; menos.setAttribute("aria-label", "Uno menos");
    var q = el("output", null, "1");
    var mas = el("button", null, "+"); mas.type = "button"; mas.setAttribute("aria-label", "Uno más");
    cant.append(menos, q, mas);
    var enviar = $("#bolsa-form [type=submit]");
    var ok = el("button", enviar ? enviar.className : "btn"); ok.type = "submit";
    pie.append(cant, ok);
    form.append(err, nota, pie);
    ficha.appendChild(form);

    var n = 1;
    function elegidas() {
      var out = [];
      grupos.forEach(function (g, gi) {
        $$('input[name="g' + gi + '"]:checked', form).forEach(function (i) { out.push({ g: g, o: g.ops[+i.value] }); });
      });
      return out;
    }
    function precio() { return elegidas().reduce(function (a, e) { return a + (e.o.p || 0); }, base); }
    function refrescar() {
      q.textContent = n;
      menos.disabled = n < 2;
      ok.textContent = "Agregar · " + soles(precio() * n);
      grupos.forEach(function (g, gi) {
        if (!g.max) return;
        var marcadas = $$('input[name="g' + gi + '"]:checked', form).length;
        $$('input[name="g' + gi + '"]', form).forEach(function (i) { i.disabled = !i.checked && marcadas >= g.max; });
      });
    }
    menos.addEventListener("click", function () { if (n > 1) { n--; refrescar(); } });
    mas.addEventListener("click", function () { n++; refrescar(); });
    form.addEventListener("change", function () { err.hidden = true; refrescar(); });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      for (var gi = 0; gi < grupos.length; gi++) {
        var g = grupos[gi];
        if (g.min && $$('input[name="g' + gi + '"]:checked', form).length < g.min) {
          err.textContent = g.t + ": elige " + g.min + ".";
          err.hidden = false;
          return;
        }
      }
      var es = elegidas();
      sumar({
        n: b.dataset.nombre,
        p: precio(),
        q: n,
        o: es.map(function (e) { return e.o.p ? "+ " + e.o.n : e.o.n; }),
        nota: ni.value.trim()
      });
      ficha.close();
    });
    refrescar();
    ficha.showModal();
    ficha.scrollTop = 0;
  }

  $$("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      var grupos = opcionesDe(b);
      var card = b.closest("figure, article");
      if (card && !$("img", card)) card = null;
      if (grupos.length || card) abrirFicha(b, grupos, card);
      else sumar({ n: b.dataset.nombre, p: parseFloat(b.dataset.precio), q: 1, o: [], nota: "" });
    });
  });

  $$("[data-abrir-bolsa]").forEach(function (b) {
    b.addEventListener("click", function () { if (bolsa) { pintar(); bolsa.showModal(); } });
  });
  $$("[data-cerrar]").forEach(function (b) {
    b.addEventListener("click", function () { b.closest("dialog").close(); });
  });
  $$("dialog").forEach(function (d) {
    d.addEventListener("click", function (ev) { if (ev.target === d) d.close(); });
  });

  /* ---------- Formulario del pedido: entrega, horario y pago ---------- */
  var fb = $("#bolsa-form");
  if (fb) {
    var dir = $("#campo-direccion");
    var prog = $("#campo-programar");
    var vuelto = $("#campo-vuelto");
    var cerradoMsg = $("[data-cerrado]", fb);
    var dias = (fb.dataset.dias || "0123456").split("").map(Number);
    var desde = aMin(fb.dataset.desde || "12:00"), hasta = aMin(fb.dataset.hasta || "21:00");
    var selDia = $("select[name=dia]", fb), selHora = $("select[name=hora]", fb);
    var NOMBRES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    var abiertoAhora = false;

    var horasDe = function (d, ahora) {
      var out = [], mismoDia = d.toDateString() === ahora.toDateString();
      var primero = mismoDia ? Math.max(desde + 30, Math.ceil((ahora.getHours() * 60 + ahora.getMinutes() + 45) / 30) * 30) : desde + 30;
      for (var m = primero; m <= hasta; m += 30) out.push(aHora(m));
      return out;
    };
    var llenarHoras = function () {
      if (!selDia || !selHora) return;
      var ahora = ahoraLima();
      var d = new Date(+selDia.value);
      selHora.textContent = "";
      horasDe(d, ahora).forEach(function (h) { var o = el("option", null, h); o.value = h; selHora.appendChild(o); });
    };
    var llenarDias = function () {
      if (!selDia) return;
      var ahora = ahoraLima();
      selDia.textContent = "";
      for (var i = 0; i < 8 && selDia.options.length < 6; i++) {
        var d = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + i);
        if (dias.indexOf(d.getDay()) < 0 || !horasDe(d, ahora).length) continue;
        var txt = i === 0 ? "Hoy" : i === 1 ? "Mañana" : NOMBRES[d.getDay()] + " " + d.getDate();
        var o = el("option", null, txt); o.value = d.getTime();
        o.dataset.largo = NOMBRES[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
        selDia.appendChild(o);
      }
      llenarHoras();
    };
    var revisarHorario = function () {
      var ahora = ahoraLima(), m = ahora.getHours() * 60 + ahora.getMinutes();
      abiertoAhora = dias.indexOf(ahora.getDay()) >= 0 && m >= desde && m < hasta - 15;
      var ya = $("input[name=cuando][value=ya]", fb);
      if (ya) {
        ya.disabled = !abiertoAhora;
        if (!abiertoAhora) { ya.checked = false; $("input[name=cuando][value=programar]", fb).checked = true; }
      }
      if (cerradoMsg) {
        cerradoMsg.hidden = abiertoAhora;
        cerradoMsg.textContent = "Ahora no estamos tomando pedidos (atendemos de " + aHora(desde) + " a " + aHora(hasta) + "). Prográmalo para cuando abramos.";
      }
    };
    var sync = function () {
      var modo = ($("input[name=modo]:checked", fb) || {}).value;
      if (dir) { dir.hidden = modo !== "delivery"; $("input", dir).required = modo === "delivery"; }
      var cuando = ($("input[name=cuando]:checked", fb) || {}).value;
      if (prog) prog.hidden = cuando !== "programar";
      var pago = ($("input[name=pago]:checked", fb) || {}).value;
      if (vuelto) vuelto.hidden = pago !== "Efectivo";
      pintar();
    };
    $$("input[name=modo], input[name=cuando], input[name=pago]", fb).forEach(function (r) { r.addEventListener("change", sync); });
    if (selDia) selDia.addEventListener("change", llenarHoras);
    if (bolsa) $$("[data-abrir-bolsa]").forEach(function (b) {
      b.addEventListener("click", function () { revisarHorario(); llenarDias(); sync(); });
    });
    revisarHorario(); llenarDias(); sync();

    fb.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!items.length) { marcarError(fb, null, "Tu pedido está vacío. Agrega algo de la carta."); return; }
      var errPrevio = $(".f-err", fb); if (errPrevio) errPrevio.hidden = true;
      var f = new FormData(fb);
      var min = parseFloat(body.dataset.min || "0");
      if (min && f.get("modo") === "delivery" && total() < min) { pintar(); return; }
      if (f.get("modo") === "delivery" && !String(f.get("direccion") || "").trim()) { marcarError(fb, $("input", dir), "Escribe la dirección de entrega."); return; }
      if (!String(f.get("nombre") || "").trim()) { marcarError(fb, $("input[name=nombre]", fb), "Escribe tu nombre para que el local sepa de quién es el pedido."); return; }
      var lineas = ["Hola " + body.dataset.local + ", quiero hacer este pedido:", ""];
      items.forEach(function (i) {
        lineas.push("• " + i.q + " × " + i.n + " — " + soles(i.p * i.q));
        if (i.o && i.o.length) lineas.push("   " + i.o.join(", "));
        if (i.nota) lineas.push("   Nota: " + i.nota);
      });
      lineas.push("", "Total de la carta: " + soles(total()));
      lineas.push(f.get("modo") === "delivery" ? "Entrega: delivery a " + f.get("direccion") : "Entrega: recojo en el local");
      if (f.get("cuando") === "programar" && selDia && selDia.selectedOptions[0] && f.get("hora")) {
        lineas.push("Para: " + selDia.selectedOptions[0].dataset.largo + ", a las " + f.get("hora"));
      } else if (f.get("cuando")) {
        lineas.push("Para: lo antes posible");
      }
      if (f.get("pago")) {
        var pago = "Pago: " + f.get("pago");
        if (f.get("pago") === "Efectivo" && f.get("vuelto")) pago += " (pago con S/ " + String(f.get("vuelto")).replace(/[^\d.,]/g, "") + ")";
        lineas.push(pago);
      }
      if (body.dataset.sede) lineas.push("Sede: " + body.dataset.sede);
      lineas.push("A nombre de: " + f.get("nombre"));
      if (f.get("nota")) lineas.push("Nota: " + f.get("nota"));
      abrirWa(lineas.join("\n"));
      var ok = mensajeEn(fb, "f-ok");
      ok.textContent = "";
      ok.append(el("b", null, "Tu pedido se abrió en WhatsApp."), " Solo falta tocar enviar allí. ");
      var vaciar = el("button", "f-vaciar", "Vaciar mi pedido"); vaciar.type = "button";
      vaciar.addEventListener("click", function () { items.length = 0; guardar(); pintar(); ok.hidden = true; avisar("Pedido vaciado"); });
      ok.append(vaciar);
      ok.hidden = false;
    });
  }
  pintar();

  /* ---------- Índice de la carta: cuántos platos hay y en qué sección vas ---------- */
  var contar = function (sec) { return sec ? ($$("li", sec).length || $$("[data-add]", sec).length) : 0; };
  $$(".indice a[href^='#'], [role=tab][aria-controls]").forEach(function (a) {
    var sec = document.getElementById(a.getAttribute("aria-controls") || a.getAttribute("href").slice(1));
    var n = contar(sec);
    if (n && !$(".cnt", a)) { var s = el("small", "cnt", n); s.setAttribute("aria-hidden", "true"); a.appendChild(s); }
  });
  var indice = $(".indice");
  if (indice && "IntersectionObserver" in window) {
    var links = $$("a[href^='#']", indice);
    var marcar = function (id) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        if (on) {
          a.setAttribute("aria-current", "true");
          indice.scrollTo({ left: a.offsetLeft - indice.clientWidth / 2 + a.offsetWidth / 2, behavior: "smooth" });
        } else a.removeAttribute("aria-current");
      });
    };
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) marcar(e.target.id); });
    }, { rootMargin: "-30% 0px -60% 0px" });
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute("href").slice(1)); if (s) io.observe(s); });
  }
  var top = $(".top");
  if (top) document.documentElement.style.setProperty("--alto-top", top.offsetHeight + "px");

  /* ---------- Reserva ---------- */
  $$("form[data-reserva]").forEach(function (form) {
    var dias = (form.dataset.dias || "0123456").split("").map(Number);
    var desde = form.dataset.desde || "12:00", hasta = form.dataset.hasta || "21:00";
    var fecha = $("input[name=fecha]", form), hora = $("input[name=hora]", form), msg = $(".r-error", form);
    var hoy = new Date(); hoy.setMinutes(hoy.getMinutes() - hoy.getTimezoneOffset());
    if (fecha) fecha.min = hoy.toISOString().slice(0, 10);
    if (hora) { hora.min = desde; hora.max = hasta; }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var f = new FormData(form);
      var d = new Date(f.get("fecha") + "T12:00:00");
      var error = "";
      if (!String(f.get("nombre") || "").trim()) error = "Escribe tu nombre para la reserva.";
      else if (!f.get("fecha")) error = "Elige el día de tu reserva.";
      else if (dias.indexOf(d.getDay()) < 0) error = form.dataset.diasTexto || "Ese día el local no atiende.";
      else if (f.get("hora") < desde || f.get("hora") > hasta) error = "Las reservas son entre " + desde + " y " + hasta + ".";
      if (msg) { msg.textContent = error; msg.hidden = !error; }
      if (error) return;
      var bonita = d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
      var t = ["Hola " + body.dataset.local + ", quiero reservar una mesa:", "",
        "• Fecha: " + bonita, "• Hora: " + f.get("hora"), "• Personas: " + f.get("personas"), "• A nombre de: " + f.get("nombre")];
      if (body.dataset.sede) t.push("• Sede: " + body.dataset.sede);
      if (f.get("nota")) t.push("• Nota: " + f.get("nota"));
      t.push("", "¿Me confirman, por favor?");
      abrirWa(t.join("\n"));
    });
  });
})();
