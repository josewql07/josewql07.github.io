/* Estado abierto/cerrado (hora de Lima) y pestañas de la carta */
(function () {
  "use strict";
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  /* Horario de Google Maps (18-11-2026): lunes a sábado 12:30 a 22:30, domingo 12:30 a 21:30 */
  var CIERRE = { Mon: 22.5, Tue: 22.5, Wed: 22.5, Thu: 22.5, Fri: 22.5, Sat: 22.5, Sun: 21.5 };
  var APERTURA = 12.5;
  function hm(h) { var m = Math.round((h % 1) * 60); return (Math.floor(h) > 12 ? Math.floor(h) - 12 : Math.floor(h)) + (m ? ":" + (m < 10 ? "0" : "") + m : "") + " p. m."; }
  $$("[data-estado]").forEach(function (est) {
    try {
      var p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
      var dia = p.filter(function (x) { return x.type === "weekday"; })[0].value;
      var h = parseInt(p.filter(function (x) { return x.type === "hour"; })[0].value, 10) + parseInt(p.filter(function (x) { return x.type === "minute"; })[0].value, 10) / 60;
      var abierto = h >= APERTURA && h < CIERRE[dia];
      est.textContent = abierto ? "Abierto ahora, hasta las " + hm(CIERRE[dia]) : (h < APERTURA ? "Cerrado. Abrimos hoy a las 12:30 p. m." : "Cerrado. Abrimos mañana a las 12:30 p. m.");
      est.classList.add(abierto ? "si" : "no");
    } catch (err) {}
  });
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


