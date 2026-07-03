/* =============================================
   営業代行会社 コーポレートサイト
   スライダー / スクロール演出 / ナビ
   ============================================= */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. ナビ：スクロールで背景変化 ---------- */
  var nav = document.getElementById("siteNav");

  function onScrollNav() {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- 2. ハンバーガーメニュー（SP） ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  });

  // メニュー内リンクをタップしたら閉じる
  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A" && navLinks.classList.contains("is-open")) {
      navLinks.classList.remove("is-open");
      navToggle.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- 3. シグネチャー縦ライン（スクロール進捗） ---------- */
  var progressLine = document.getElementById("signatureProgress");

  function onScrollProgress() {
    var doc = document.documentElement;
    var total = doc.scrollHeight - window.innerHeight;
    var ratio = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
    progressLine.style.transform = "scaleY(" + ratio + ")";
  }
  if (!prefersReducedMotion) {
    window.addEventListener("scroll", onScrollProgress, { passive: true });
    window.addEventListener("resize", onScrollProgress);
    onScrollProgress();
  }

  /* ---------- 4. スクロールリビール（IntersectionObserver） ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    // 強みカードは順番に（stagger 80ms）
    var cards = document.querySelectorAll(".strength-card");
    cards.forEach(function (card, i) {
      card.style.setProperty("--stagger", (i * 0.08) + "s");
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- 5. 数字カウントアップ ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll(".count"));

  function formatNum(n) {
    return n.toLocaleString("ja-JP");
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var duration = 1600;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNum(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    counters.forEach(function (el) {
      el.textContent = formatNum(parseInt(el.getAttribute("data-count"), 10));
    });
  } else {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- 6. サービススライダー ---------- */
  var slider = document.getElementById("serviceSlider");
  var tabs = Array.prototype.slice.call(slider.querySelectorAll(".slider-tab"));
  var slides = Array.prototype.slice.call(slider.querySelectorAll(".slide"));
  var indicator = document.getElementById("tabIndicator");
  var current = 0;

  function moveIndicator() {
    var tab = tabs[current];
    indicator.style.width = tab.offsetWidth + "px";
    indicator.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  function goTo(index, fromKeyboard) {
    var next = (index + slides.length) % slides.length;
    if (next === current) return;
    var goingLeft = next < current && !(current === 0 && next === slides.length - 1);
    if (current === slides.length - 1 && next === 0) goingLeft = false;

    var leaving = slides[current];
    var entering = slides[next];

    // 退場方向をクラスで指示
    leaving.classList.remove("is-active");
    leaving.classList.toggle("is-leaving-left", !goingLeft);
    leaving.setAttribute("hidden", "");

    entering.removeAttribute("hidden");
    // reflowを挟んでtransitionを効かせる
    void entering.offsetWidth;
    entering.classList.remove("is-leaving-left");
    entering.classList.add("is-active");

    tabs[current].classList.remove("is-active");
    tabs[current].setAttribute("aria-selected", "false");
    tabs[next].classList.add("is-active");
    tabs[next].setAttribute("aria-selected", "true");

    current = next;
    moveIndicator();

    if (fromKeyboard) tabs[current].focus();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      goTo(parseInt(tab.getAttribute("data-index"), 10));
    });
  });

  document.getElementById("prevSlide").addEventListener("click", function () { goTo(current - 1); });
  document.getElementById("nextSlide").addEventListener("click", function () { goTo(current + 1); });

  // キーボード操作（← →）
  slider.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1, true); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1, true); }
  });

  // スワイプ対応
  var touchStartX = null;
  var viewport = slider.querySelector(".slider-viewport");

  viewport.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  viewport.addEventListener("touchend", function (e) {
    if (touchStartX === null) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 48) {
      goTo(dx < 0 ? current + 1 : current - 1);
    }
    touchStartX = null;
  }, { passive: true });

  // 初期位置＆リサイズ追従
  window.addEventListener("resize", moveIndicator);
  window.addEventListener("load", moveIndicator);
  moveIndicator();

  /* ---------- 7. 強みカード：カーソル追従のゴールド光 ---------- */
  if (!prefersReducedMotion) {
    document.querySelectorAll(".strength-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }

  /* ---------- 8. ヒーロー：控えめなパララックス ---------- */
  var heroInner = document.querySelector(".hero .container");
  if (!prefersReducedMotion && heroInner) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight) {
          heroInner.style.transform = "translateY(" + (y * 0.18) + "px)";
          heroInner.style.opacity = String(Math.max(1 - y / (window.innerHeight * 0.9), 0));
        }
        ticking = false;
      });
    }, { passive: true });
  }
})();
