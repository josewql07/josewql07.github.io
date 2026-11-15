/* Entrada de la página: pantalla de apertura, titular que sube palabra por palabra,
   foto que entra y flota, botones que reaccionan al cursor y secciones que aparecen al bajar.
   Sin librerías. Cada demo pone su propia pantalla en <div class="splash" data-splash> (ver su index.html)
   y su propio ritmo en intro.css (variables --e-h, --dur, --desp, --paso). */
(function () {
  "use strict";
  var root = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hayIO = "IntersectionObserver" in window;
  var splash = $("[data-splash]");
  var abierto = false;
  var clave = "apertura-" + (document.body.dataset.slug || location.pathname);

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
    if (splash) setTimeout(function () { splash.hidden = true; }, +(splash.dataset.out || 800) + 600);
  }

  /* La apertura completa se ve una vez por visita; si vuelve a la página en la misma pestaña, entra directo */
  function yaLaVio() {
    try { if (sessionStorage.getItem(clave)) return true; sessionStorage.setItem(clave, "1"); } catch (e) {}
    return false;
  }

  function apertura() {
    if (!splash || reduce || yaLaVio()) { if (splash) splash.hidden = true; abrir(); return; }
    var barra = $(".splash-bar i", splash);
    var cifras = $$("[data-count]", splash);
    var t0 = Date.now(), MIN = +(splash.dataset.min || 2100), SALIDA = +(splash.dataset.out || 800), cargado = document.readyState === "complete", hecho = false;
    window.addEventListener("load", function () { cargado = true; }, { once: true });
    var tCarga = setTimeout(function () { cargado = true; }, MIN + 500);
    var tTope = setTimeout(salir, MIN + 1200);
    (function paso() {
      if (hecho) return;
      var t = Math.min(1, (Date.now() - t0 - 150) / (MIN - 300));
      t = Math.max(0, 1 - Math.pow(1 - t, 3));
      if (barra) barra.style.transform = "scaleX(" + t + ")";
      cifras.forEach(function (c) { c.textContent = Math.round(+c.dataset.from + (+c.dataset.to - +c.dataset.from) * t); });
      if (t >= 1 && cargado) return salir();
      requestAnimationFrame(paso);
    })();
    function salir() {
      if (hecho) return;
      hecho = true;
      clearTimeout(tCarga); clearTimeout(tTope);
      cifras.forEach(function (c) { c.textContent = c.dataset.to; });
      splash.classList.add("is-out");
      setTimeout(abrir, Math.round(SALIDA * .45));
    }
  }

  /* La portada deja de animarse (flotar, halo, cursor) cuando ya no se ve */
  var heroVisible = true;
  function pausarFuera() {
    var hero = $(".hero");
    if (!hero || !hayIO) return;
    new IntersectionObserver(function (ents) {
      heroVisible = ents[0].isIntersecting;
      hero.classList.toggle("is-offscreen", !heroVisible);
    }).observe(hero);
  }

  /* Botones y foto que reaccionan al cursor (solo con mouse); un cálculo por cuadro como máximo */
  function reaccion() {
    if (!fino || reduce) return;
    var porCuadro = function (fn) {
      var ev = null, pedido = false;
      return function (e) {
        ev = e;
        if (pedido) return;
        pedido = true;
        requestAnimationFrame(function () { pedido = false; if (heroVisible) fn(ev); });
      };
    };
    $$(".hero .btn, .hero .sede-sel button").forEach(function (b) {
      b.addEventListener("pointermove", porCuadro(function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx", ((e.clientX - r.left - r.width / 2) / r.width * 10).toFixed(1) + "px");
        b.style.setProperty("--my", ((e.clientY - r.top - r.height / 2) / r.height * 8).toFixed(1) + "px");
      }));
      b.addEventListener("pointerleave", function () { b.style.removeProperty("--mx"); b.style.removeProperty("--my"); });
    });
    var hero = $(".hero"), foto = $(".hero-foto img, .arco img");
    if (hero && foto) {
      hero.addEventListener("pointermove", porCuadro(function (e) {
        var r = hero.getBoundingClientRect();
        foto.style.setProperty("--px", (((e.clientX - r.left) / r.width - .5) * -14).toFixed(1) + "px");
        foto.style.setProperty("--py", (((e.clientY - r.top) / r.height - .5) * -10).toFixed(1) + "px");
      }));
      hero.addEventListener("pointerleave", function () { foto.style.setProperty("--px", "0px"); foto.style.setProperty("--py", "0px"); });
    }
  }

  /* Al bajar: títulos, fotos y tarjetas aparecen una vez, en cascada corta (máx. 5 pasos) */
  function revelar() {
    if (reduce || !hayIO) return;
    var sel = "main>section:not(.hero) h2, main>section:not(.hero) [class*='-grid']>*, main>section:not(.hero) figure, .sigla>li, .reservas form";
    var todos = $$(sel).filter(function (el) { return !el.closest(".carta .sec, .carta .pane, .carta .grupo, .panel-carta"); });
    var items = todos.filter(function (el) { return !todos.some(function (o) { return o !== el && o.contains(el); }); });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("rv-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) {
      var hermanos = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty("--k", Math.min(hermanos, 5));
      el.classList.add("rv");
      io.observe(el);
    });
    setTimeout(function () { items.forEach(function (el) { el.classList.add("rv-in"); }); io.disconnect(); }, 15000); // seguro
  }

  partir();
  reaccion();
  pausarFuera();
  revelar();
  apertura();
  setTimeout(abrir, 4400); // seguro
})();
