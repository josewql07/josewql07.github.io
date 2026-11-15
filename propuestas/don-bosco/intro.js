/* Entrada de la página: pantalla de apertura con contador, titular que sube palabra por palabra,
   foto que entra y flota, botones que reaccionan al cursor. Sin librerías.
   Cada demo pone su propia pantalla en <div class="splash" data-splash> (ver su index.html). */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var splash = $("[data-splash]");
  var abierto = false;

  /* Titular: cada palabra sube desde una máscara */
  function partir() {
    var h = $(".hero h1");
    if (!h || h.dataset.partido) return;
    h.dataset.partido = "1";
    h.setAttribute("aria-label", h.textContent.trim().replace(/\s+/g, " "));
    var n = 0;
    var esc = function (s) { return s.replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    var palabras = function (t) {
      return t.split(/(\s+)/).map(function (w) {
        if (!w) return "";
        if (/^\s+$/.test(w)) return " ";
        return '<span class="w" aria-hidden="true"><span style="--i:' + (n++) + '">' + esc(w) + "</span></span>";
      }).join("");
    };
    h.innerHTML = Array.prototype.map.call(h.childNodes, function (nodo) {
      if (nodo.nodeType === 3) return palabras(nodo.textContent);
      if (nodo.nodeName === "BR") return "<br>";
      if (nodo.nodeType === 1) { var t = nodo.tagName.toLowerCase(); return "<" + t + ">" + palabras(nodo.textContent) + "</" + t + ">"; }
      return "";
    }).join("");
  }

  function abrir() {
    if (abierto) return;
    abierto = true;
    root.classList.add("is-open");
    if (splash) setTimeout(function () { splash.hidden = true; }, 1400);
  }

  function contar(el, de, a, t) {
    var v = Math.round(de + (a - de) * t);
    el.textContent = v;
  }

  function apertura() {
    if (!splash || reduce) { if (splash) splash.hidden = true; abrir(); return; }
    var barra = $(".splash-bar i", splash);
    var cifras = $$("[data-count]", splash);
    var t0 = Date.now(), MIN = 2100, cargado = document.readyState === "complete", hecho = false;
    window.addEventListener("load", function () { cargado = true; });
    setTimeout(function () { cargado = true; }, MIN + 500);
    (function paso() {
      if (hecho) return;
      var t = Math.min(1, (Date.now() - t0 - 150) / (MIN - 300));
      t = Math.max(0, 1 - Math.pow(1 - t, 3));
      if (barra) barra.style.transform = "scaleX(" + t + ")";
      cifras.forEach(function (c) { contar(c, +c.dataset.from, +c.dataset.to, t); });
      if (t >= 1 && cargado) return salir();
      requestAnimationFrame(paso);
    })();
    function salir() {
      if (hecho) return;
      hecho = true;
      cifras.forEach(function (c) { c.textContent = c.dataset.to; });
      splash.classList.add("is-out");
      setTimeout(abrir, 350);
    }
    setTimeout(salir, 3800);
  }

  /* Botones y fotos que reaccionan al cursor (solo con mouse) */
  function reaccion() {
    if (!fino || reduce) return;
    $$(".hero .btn, .hero .sede-sel button").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) / r.width * 10).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) / r.height * 8).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.removeProperty("--mx"); b.style.removeProperty("--my"); });
    });
    var hero = $(".hero"), foto = $(".hero-foto img, .arco img");
    if (hero && foto) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        foto.style.setProperty("--px", ((e.clientX - r.left) / r.width - .5) * -14 + "px");
        foto.style.setProperty("--py", ((e.clientY - r.top) / r.height - .5) * -10 + "px");
      });
      hero.addEventListener("pointerleave", function () { foto.style.setProperty("--px", "0px"); foto.style.setProperty("--py", "0px"); });
    }
  }

  partir();
  reaccion();
  apertura();
  setTimeout(abrir, 4600); // seguro
})();
