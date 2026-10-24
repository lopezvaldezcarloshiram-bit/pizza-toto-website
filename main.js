(function () {
  "use strict";

  var data = window.__BRAND__ || {};
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }
  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "]", e); }
  }

  /* ---------- Splash ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 500);
    else window.addEventListener("load", function () { setTimeout(hide, 350); });
    setTimeout(hide, 3200);
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var toggle = $("[data-nav-toggle]");
    var links = $("[data-nav-links]");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-link", links).forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Smooth anchor scroll (native) ---------- */
  function initSmoothScroll() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var navOffset = 90;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - navOffset,
        behavior: reduced ? "auto" : "smooth",
      });
    });
  }

  /* ---------- Split text (preserves <br> and <em>) ---------- */
  function splitWords(el) {
    if (!el || el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    var wrap = function (text) {
      return text.split(/(\s+)/).map(function (w) {
        return /^\s+$/.test(w) ? w : '<span class="split-word">' + escHTML(w) + "</span>";
      }).join("");
    };
    var html = Array.prototype.map.call(el.childNodes, function (node) {
      if (node.nodeType === 3) return wrap(node.textContent);
      if (node.nodeName === "BR") return "<br>";
      if (node.nodeType === 1) {
        var tag = node.tagName.toLowerCase();
        return "<" + tag + ">" + wrap(node.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
  }
  function initSplitText() {
    $$("[data-split]").forEach(splitWords);
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveals() {
    var targets = $$(".reveal");
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (t) { io.observe(t); });

    // Safety net: force-reveal anything still hidden after 6s
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- Hero slideshow ---------- */
  function initHero() {
    var slides = data.heroSlides;
    if (!slides || !slides.length) return;
    var kicker = $("[data-slide-kicker]");
    var title = $("[data-slide-title]");
    var text = $("[data-slide-text]");
    var dotsWrap = $("[data-hero-dots]");
    if (!kicker || !title || !text) return;

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Diapositiva " + (i + 1));
      if (dotsWrap) dotsWrap.appendChild(b);
      return b;
    });

    var index = 0;
    function render(i) {
      var s = slides[i];
      kicker.textContent = s.kicker;
      title.innerHTML = '<span>' + escHTML(s.title) + "</span>";
      text.textContent = s.text;
      dots.forEach(function (d, di) { d.classList.toggle("is-active", di === i); });
    }
    dots.forEach(function (d, i) {
      d.addEventListener("click", function () { index = i; render(index); restart(); });
    });

    var timer = null;
    function restart() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        index = (index + 1) % slides.length;
        render(index);
      }, 5500);
    }
    render(0);
    restart();
  }

  /* ---------- WhatsApp links ---------- */
  function buildWaLink(number, message) {
    var n = (number || data.whatsappDefault || "").replace(/[^\d]/g, "");
    var q = encodeURIComponent(message || ("Hola, quiero hacer un pedido en Pizza & Totó"));
    return "https://wa.me/" + n + "?text=" + q;
  }
  function initWhatsApp() {
    var branches = data.branches || [];
    $$("[data-wa-branch]").forEach(function (a) {
      var id = a.getAttribute("data-wa-branch");
      var b = branches.filter(function (x) { return x.id === id; })[0];
      var number = b ? b.whatsapp : data.whatsappDefault;
      var msg = b ? ("Hola, quiero hacer un pedido en la sucursal " + b.name) : undefined;
      a.setAttribute("href", buildWaLink(number, msg));
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
    $$("[data-menu-link]").forEach(function (a) {
      var url = data.menuUrl;
      if (url && url !== "#") {
        a.setAttribute("href", url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      } else {
        a.setAttribute("href", buildWaLink(data.whatsappDefault, "Hola, me gustaría ver el menú de Pizza & Totó"));
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
      }
    });
  }

  /* ---------- Contact form (visual submit, no backend) ---------- */
  function initContactForm() {
    var form = $("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var note = $("[data-form-note]", form);
      if (note) note.hidden = false;
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = $("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Subtle GSAP parallax on hero art (optional polish) ---------- */
  function initParallax() {
    if (!window.gsap || !window.ScrollTrigger || reduced) return;
    gsap.registerPlugin(ScrollTrigger);
    var art = $(".hero-bg-img");
    if (!art) return;
    gsap.to(art, {
      y: -30,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
    });
  }

  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initSplitText, "initSplitText");
    safe(initReveals, "initReveals");
    safe(initHero, "initHero");
    safe(initWhatsApp, "initWhatsApp");
    safe(initContactForm, "initContactForm");
    safe(initYear, "initYear");
    safe(initParallax, "initParallax");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
