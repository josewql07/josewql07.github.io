/* Pedidos y reservas que terminan en WhatsApp. Sin servidor.
   El número sale de <body data-wa="51...">; el local, de data-local; el pedido mínimo, de data-min (opcional). */
(function () {
  "use strict";
  var body = document.body;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var soles = function (n) { return "S/ " + n.toFixed(2); };
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
    var w = window.open(url, "_blank", "noopener");
    if (!w) location.href = url;
  };

  /* ---------- Pedido ---------- */
  var bolsa = $("#bolsa");
  var items = [];
  var KEY = "pedido-" + (body.dataset.slug || "demo");
  try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (err) { items = []; }
  var guardar = function () { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (err) {} };
  var total = function () { return items.reduce(function (a, i) { return a + i.p * i.q; }, 0); };
  var cuenta = function () { return items.reduce(function (a, i) { return a + i.q; }, 0); };

  function pintar() {
    $$("[data-cuenta]").forEach(function (el) { el.textContent = cuenta(); });
    $$("[data-total]").forEach(function (el) { el.textContent = soles(total()); });
    $$("[data-con-items]").forEach(function (el) { el.hidden = !items.length; });
    $$("[data-sin-items]").forEach(function (el) { el.hidden = !!items.length; });
    var lista = $("#bolsa-items");
    if (!lista) return;
    lista.textContent = "";
    if (!items.length) {
      var v = document.createElement("li");
      v.className = "vacio";
      v.textContent = "Aún no agregas nada. Elige en la carta con el botón +.";
      lista.appendChild(v);
    }
    items.forEach(function (it, k) {
      var li = document.createElement("li");
      var n = document.createElement("span"); n.className = "b-nombre"; n.textContent = it.n;
      var c = document.createElement("span"); c.className = "b-cant";
      var menos = document.createElement("button"); menos.type = "button"; menos.textContent = "−"; menos.setAttribute("aria-label", "Quitar uno de " + it.n);
      var q = document.createElement("output"); q.textContent = it.q;
      var mas = document.createElement("button"); mas.type = "button"; mas.textContent = "+"; mas.setAttribute("aria-label", "Agregar uno de " + it.n);
      menos.addEventListener("click", function () { it.q--; if (it.q < 1) items.splice(k, 1); guardar(); pintar(); });
      mas.addEventListener("click", function () { it.q++; guardar(); pintar(); });
      c.append(menos, q, mas);
      var p = document.createElement("span"); p.className = "b-precio"; p.textContent = soles(it.p * it.q);
      li.append(n, c, p);
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

  $$("[data-add]").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = b.dataset.nombre, p = parseFloat(b.dataset.precio);
      var it = items.filter(function (i) { return i.n === n; })[0];
      if (it) it.q++; else items.push({ n: n, p: p, q: 1 });
      guardar(); pintar();
      avisar("Agregado: " + n);
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

  var fb = $("#bolsa-form");
  if (fb) {
    var dir = $("#campo-direccion");
    var sync = function () {
      var modo = ($("input[name=modo]:checked", fb) || {}).value;
      if (dir) { dir.hidden = modo !== "delivery"; $("input", dir).required = modo === "delivery"; }
      pintar();
    };
    $$("input[name=modo]", fb).forEach(function (r) { r.addEventListener("change", sync); });
    sync();
    fb.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!items.length) { avisar("Tu pedido está vacío"); return; }
      var f = new FormData(fb);
      var min = parseFloat(body.dataset.min || "0");
      if (min && f.get("modo") === "delivery" && total() < min) { pintar(); return; }
      var lineas = ["Hola " + body.dataset.local + ", quiero hacer este pedido:", ""];
      items.forEach(function (i) { lineas.push("• " + i.q + " × " + i.n + " — " + soles(i.p * i.q)); });
      lineas.push("", "Total de la carta: " + soles(total()));
      lineas.push(f.get("modo") === "delivery" ? "Entrega: delivery a " + f.get("direccion") : "Entrega: recojo en el local");
      if (body.dataset.sede) lineas.push("Sede: " + body.dataset.sede);
      lineas.push("A nombre de: " + f.get("nombre"));
      if (f.get("nota")) lineas.push("Nota: " + f.get("nota"));
      abrirWa(lineas.join("\n"));
    });
  }
  pintar();

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
      if (dias.indexOf(d.getDay()) < 0) error = form.dataset.diasTexto || "Ese día el local no atiende.";
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
