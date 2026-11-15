/* Carta por categorías: una a la vez, para no bajar tanto. Sin JavaScript se ve todo. */
(function () {
  "use strict";
  var lista = document.querySelector(".tabs-carta");
  if (!lista) return;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var tabs = $$("[role=tab]", lista);
  var paneles = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  lista.hidden = false;

  function ver(i, opts) {
    opts = opts || {};
    tabs.forEach(function (t, k) {
      var on = k === i;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      paneles[k].hidden = !on;
    });
    if (opts.foco) tabs[i].focus();
    var t = tabs[i];
    lista.scrollTo({ left: t.offsetLeft - lista.clientWidth / 2 + t.offsetWidth / 2, behavior: opts.suave === false ? "auto" : "smooth" });
    if (opts.subir) {
      var cab = document.querySelector("#carta .cab");
      var tope = (cab || lista).getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY > tope) window.scrollTo({ top: tope, behavior: "smooth" });
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { ver(i, { subir: true }); });
    t.addEventListener("keydown", function (ev) {
      var k = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
      if (k) { ev.preventDefault(); ver((i + k + tabs.length) % tabs.length, { foco: true }); }
    });
  });

  /* Un enlace a #bebidas (u otra sección) abre su categoría */
  function porHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return false;
    var el = document.getElementById(id);
    if (!el) return false;
    var p = el.closest(".panel-carta");
    if (!p) return false;
    var i = paneles.indexOf(p);
    if (i < 0) return false;
    ver(i, { suave: false });
    if (el !== p) el.scrollIntoView();
    return true;
  }
  if (!porHash()) ver(0, { suave: false });
  window.addEventListener("hashchange", porHash);
})();
