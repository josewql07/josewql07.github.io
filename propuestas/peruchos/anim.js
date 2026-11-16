/* Micro-animación: el contador del pedido salta cuando cambia. Sin bucles ni timers que queden corriendo. */
(function () {
  "use strict";
  if (!("MutationObserver" in window)) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  Array.prototype.forEach.call(document.querySelectorAll("[data-cuenta]"), function (c) {
    var antes = c.textContent;
    new MutationObserver(function () {
      if (c.textContent === antes) return;
      var sube = +c.textContent > +antes;
      antes = c.textContent;
      if (!sube) return;
      c.classList.remove("salta");
      void c.offsetWidth; /* reinicia la animación */
      c.classList.add("salta");
    }).observe(c, { childList: true, characterData: true, subtree: true });
    c.addEventListener("animationend", function () { c.classList.remove("salta"); });
  });
})();
