/* Selector de sede, estado abierto/cerrado (hora de Lima) y pestañas de la carta */
(function () {
  "use strict";
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var body = document.body;
  var SEDES = { surco: "Calle Doña Virginia 119, Santiago de Surco", lamolina: "Av. Flora Tristán 680, La Molina" };
  function elegir(btn) {
    $$("[data-sede-id]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
    body.dataset.wa = btn.dataset.wa;
    body.dataset.sede = btn.dataset.nombre;
    $$("[data-sede-dir]").forEach(function (el) { el.textContent = SEDES[btn.dataset.sedeId]; });
    $$("[data-sede-nombre]").forEach(function (el) { el.textContent = btn.dataset.nombre; });
    $$("[data-sede-wa]").forEach(function (a) { a.href = "https://wa.me/" + btn.dataset.wa; });
    $$("[data-sede-card]").forEach(function (c) { c.classList.toggle("activa", c.dataset.sedeCard === btn.dataset.sedeId); });
    try { localStorage.setItem("marasuncion-sede", btn.dataset.sedeId); } catch (err) {}
  }
  $$("[data-sede-id]").forEach(function (b) { b.addEventListener("click", function () { elegir(b); }); });
  var guardada = null;
  try { guardada = localStorage.getItem("marasuncion-sede"); } catch (err) {}
  elegir($$('[data-sede-id="' + (guardada || "surco") + '"]')[0] || $$("[data-sede-id]")[0]);

  // Martes a domingo de 8:00 a 15:00 en Lima
  var est = document.querySelector("[data-estado]");
  if (est) {
    try {
      var partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "short", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date());
      var dia = partes.filter(function (p) { return p.type === "weekday"; })[0].value;
      var hora = parseInt(partes.filter(function (p) { return p.type === "hour"; })[0].value, 10);
      var abierto = dia !== "Mon" && hora >= 8 && hora < 15;
      est.textContent = abierto ? "Abierto ahora, hasta las 3 p. m." : (dia === "Mon" || (dia === "Sun" && hora >= 15) ? "Cerrado. Abrimos el martes a las 8 a. m." : (hora < 8 ? "Cerrado. Abrimos hoy a las 8 a. m." : "Cerrado. Abrimos mañana a las 8 a. m."));
      est.classList.add(abierto ? "si" : "no");
    } catch (err) {}
  }

  // Pestañas (sin JavaScript se ven todas las categorías)
  var tabs = $$("[role=tab]");
  function ver(t, foco) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute("aria-selected", on ? "true" : "false");
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
    });
    if (foco) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { ver(t); });
    t.addEventListener("keydown", function (ev) {
      var k = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
      if (k) { ev.preventDefault(); ver(tabs[(i + k + tabs.length) % tabs.length], true); }
    });
  });
  if (tabs.length) ver(tabs[0]);
})();
