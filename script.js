/* 订婚宴邀请函 · 交互与动效 */
(function () {
  "use strict";

  const config = window.INVITATION_CONFIG || {};
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const isLuxe = document.body.classList.contains("luxe-mode");
  const previewParams = new URLSearchParams(window.location.search);
  const previewMode = previewParams.has("preview");

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const text = (selector, value) => {
    const el = $(selector);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  /* ---------- 配置文字 ---------- */
  function applyConfig() {
    text("#groomName", config.groom);
    text("#brideName", config.bride);
    text("#navMonogram", config.monogram);
    text("#preloaderMark", config.monogram);
    text("#footerMonogram", config.monogram);
    text("#eventTitle", config.eventTitle);
    text(".hero .eyebrow", config.heroEyebrow || config.eyebrow);
    text(".story__eyebrow", config.storyEyebrow || "OUR INVITATION");
    text(".mobile-nav__eyebrow", config.navEyebrow || "INVITATION");
    text("#subtitle", config.subtitle);
    text("#footerLine", config.footerLine);
    text("#signatureNames", config.host ? config.host.replace("邀请人：", "") : `${config.groom || ""} & ${config.bride || ""}`);
    text("#dateLabel", config.dateLabel);
    text("#navDate", config.dateLabel);
    text("#locationDate", config.dateLabel);
    text("#locationName", config.locationName);
    text("#locationDetail", config.locationDetail);
    text("#phoneLabel", config.phoneLabel || "邀请人");
    const contactParts = [
      config.phoneValue,
      config.contactPhone ? `电话 ${config.contactPhone}` : "",
      config.weixinId ? `微信 ${config.weixinId}` : ""
    ].filter(Boolean);
    text("#phoneValue", contactParts.join(" · ") || "如有疑问，请直接联系邀请人");
    text("#footerHost", config.host);
    text("#rsvpDeadline", config.rsvpDeadline);

    const rsvpContact = $("#rsvpContact");
    if (rsvpContact) {
      const parts = [
        config.contactPhone ? `电话 ${config.contactPhone}` : "",
        config.weixinId ? `微信 ${config.weixinId}` : ""
      ].filter(Boolean);
      rsvpContact.textContent = parts.join(" · ");
      rsvpContact.hidden = parts.length === 0;
    }

    const mapLink = $("#mapLink");
    if (mapLink && config.mapUrl) mapLink.href = config.mapUrl;

    const invitationLines = $("#invitationLines");
    if (invitationLines && Array.isArray(config.invitationLines)) {
      invitationLines.innerHTML = config.invitationLines
        .map((line) => `<p class="invitation-line">${line}</p>`)
        .join("");
    }

    const blessingsGrid = $("#blessingsGrid");
    if (blessingsGrid && Array.isArray(config.blessings)) {
      blessingsGrid.innerHTML = config.blessings
        .map(
          (item, index) => `
            <article class="blessing-card" data-reveal data-delay="${index}">
              <p class="blessing-card__text">
                <span class="blessing-card__line">${item.first}</span>
                <span class="blessing-card__line">${item.second}</span>
              </p>
            </article>`
        )
        .join("");
    }

    const timeline = $("#timeline");
    if (timeline && Array.isArray(config.agenda)) {
      timeline.innerHTML = config.agenda
        .map(
          (item, index) => `
            <li class="timeline__item" data-reveal data-delay="${index}">
              <time>${item.time}</time>
              <div><b>${item.title}</b><span>${item.note}</span></div>
            </li>`
        )
        .join("");
    }
  }

  /* ---------- 开场载入 ---------- */
  function initPreloader() {
    const preloader = $("#preloader");
    const percent = $("#loaderPercent");
    const label = $("#loaderText");
    if (!preloader) return;

    if (prefersReducedMotion || previewMode || document.readyState === "complete") {
      finishPreloader();
      return;
    }

    const heroImage = $(".hero__media img");
    const minDuration = 420;
    const maxDuration = 1200;
    const start = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (percent) percent.textContent = "100%";
      if (label) label.textContent = "马上就好";
      finishPreloader();
    };

    const finishWhenReady = () => {
      const remaining = Math.max(0, minDuration - (performance.now() - start));
      window.setTimeout(finish, remaining);
    };

    if (!heroImage || (heroImage.complete && heroImage.naturalWidth > 0)) {
      finishWhenReady();
    } else {
      heroImage.addEventListener("load", finishWhenReady, { once: true });
      heroImage.addEventListener("error", finishWhenReady, { once: true });
      if (heroImage.decode) {
        heroImage.decode().then(finishWhenReady).catch(() => {});
      }
    }

    const tick = (now) => {
      if (finished) return;
      const progress = Math.min(1, (now - start) / maxDuration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * 100);
      if (percent) percent.textContent = `${value}%`;
      if (label) label.textContent = progress < 0.42 ? "正在为您打开" : progress < 0.8 ? "正在布置喜宴" : "马上就好";
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    window.setTimeout(finish, maxDuration);
  }

  function finishPreloader() {
    const preloader = $("#preloader");
    if (!preloader) return;
    preloader.classList.add("preloader--done");
    preloader.setAttribute("aria-hidden", "true");
    document.documentElement.classList.add("page-ready");
    document.body.classList.add("page-ready");
  }

  /* ---------- 滚动揭示动画 ---------- */
  function initReveals() {
    const elements = $$("[data-reveal]");
    if (!elements.length) return;

    if (prefersReducedMotion || previewMode || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px", threshold: 0.08 }
    );

    elements.forEach((el) => {
      const delay = el.dataset.delay || 0;
      el.style.setProperty("--reveal-delay", delay);
      if (el.getBoundingClientRect().top < window.innerHeight * 0.98) {
        el.classList.add("is-visible");
        return;
      }
      observer.observe(el);
    });
  }

  function splitText() {
    const target = $("[data-split]");
    if (!target || target.dataset.splitDone) return;
    target.dataset.splitDone = "true";

    const original = target.textContent.trim();
    target.textContent = "";

    Array.from(original).forEach((char, index) => {
      if (char === " ") {
        target.appendChild(document.createTextNode(" "));
        return;
      }

      const span = document.createElement("span");
      span.className = "split-char";
      span.style.setProperty("--char-index", index);
      span.textContent = char;
      target.appendChild(span);
    });

    target.classList.remove("is-visible");
    requestAnimationFrame(() => requestAnimationFrame(() => target.classList.add("is-visible")));
  }

  /* ---------- 倒计时 ---------- */
  function initCountdown() {
    const days = $("#countDays");
    const hours = $("#countHours");
    const minutes = $("#countMinutes");
    const seconds = $("#countSeconds");
    const ending = $("#countdownEnding");
    const countdown = $("#countdown");

    const target = config.dateTime ? new Date(config.dateTime).getTime() : NaN;
    if (![days, hours, minutes, seconds].every(Boolean) || Number.isNaN(target)) return;

    const pad = (value) => String(Math.max(0, value)).padStart(2, "0");
    let timer = null;

    const update = () => {
      const distance = target - Date.now();

      if (distance <= 0) {
        countdown.hidden = true;
        ending.hidden = false;
        if (timer) window.clearInterval(timer);
        return;
      }

      days.textContent = pad(Math.floor(distance / 86400000));
      hours.textContent = pad(Math.floor((distance % 86400000) / 3600000));
      minutes.textContent = pad(Math.floor((distance % 3600000) / 60000));
      seconds.textContent = pad(Math.floor((distance % 60000) / 1000));
    };

    update();
    if (!countdown.hidden) timer = window.setInterval(update, 1000);
  }

  /* ---------- 花瓣粒子 ---------- */
  function initPetals() {
    const canvas = $("#petalCanvas");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles = [];

    const colors = [
      { r: 255, g: 220, b: 184 },
      { r: 255, g: 171, b: 195 },
      { r: 230, g: 185, b: 111 },
      { r: 255, g: 241, b: 224 },
      { r: 239, g: 111, b: 145 }
    ];

    const makeParticle = (randomY = false) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = isLuxe ? 4 + Math.random() * 8 : 2.5 + Math.random() * 7;
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + size + Math.random() * 80,
        size,
        speed: 0.18 + Math.random() * 0.52,
        sway: 0.5 + Math.random() * 1.4,
        swaySpeed: 0.3 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.018,
        opacity: 0.18 + Math.random() * 0.42,
        color
      };
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.min(24, Math.round(width / 52));
      particles = Array.from({ length: count }, () => makeParticle(true));
    };

    const drawPetal = (particle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.opacity;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 1.2);
      gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 1)`);
      gradient.addColorStop(1, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 0)`);
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.ellipse(0, 0, particle.size * 0.7, particle.size * 1.65, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(particle.size * 1.6, particle.size * 1.0, particle.size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawHeart = (particle) => {
      const size = particle.size;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.globalAlpha = particle.opacity * 0.9;

      const gradient = ctx.createLinearGradient(-size, -size, size, size);
      gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, 1)`);
      gradient.addColorStop(1, `rgba(255, 80, 101, 0.92)`);
      ctx.fillStyle = gradient;

      ctx.beginPath();
      ctx.moveTo(0, size * 0.35);
      ctx.bezierCurveTo(size * 0.8, -size * 0.2, size * 1.2, size * 0.55, 0, size * 1.2);
      ctx.bezierCurveTo(-size * 1.2, size * 0.55, -size * 0.8, -size * 0.2, 0, size * 0.35);
      ctx.fill();
      ctx.restore();
    };

    let frameId = null;
    let running = false;

    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        particle.y -= particle.speed;
        particle.x += Math.sin(particle.y * 0.008 + particle.swaySpeed) * particle.sway;
        particle.rotation += particle.rotationSpeed;

        if (particle.y < -particle.size * 3 || particle.x < -40 || particle.x > width + 40) {
          Object.assign(particle, makeParticle(false));
        }
        if (isLuxe) {
          drawHeart(particle);
        } else {
          drawPetal(particle);
        }
      });
      frameId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (running) return;
      running = true;
      frameId = requestAnimationFrame(animate);
    };

    const stop = () => {
      running = false;
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = null;
    };

    resize();
    start();

    const hero = $("#hero");
    if (hero && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !document.hidden) start();
            else stop();
          });
        },
        { threshold: 0 }
      );
      observer.observe(hero);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (!hero || hero.getBoundingClientRect().bottom > 0) start();
    });

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("orientationchange", () => window.setTimeout(resize, 250));
  }

  /* ---------- 视差与滚动状态 ---------- */
  function initScrollEffects() {
    const header = $("#siteHeader");
    const progress = $("#progressBar");
    const hero = $("#hero");
    const heroMedia = $(".hero__media");
    let ticking = false;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      header.classList.toggle("is-scrolled", scrollTop > 24);
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollTop / max) : 0})`;
      }

      if (!prefersReducedMotion && hero && heroMedia && scrollTop < window.innerHeight * 1.3) {
        heroMedia.style.transform = `translate3d(0, ${scrollTop * 0.12}px, 0) scale(1.02)`;
      } else if (heroMedia) {
        heroMedia.style.transform = "";
      }

      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(onScroll);
          ticking = true;
        }
      },
      { passive: true }
    );
    onScroll();
  }

  function initNavigation() {
    const toggle = $("#menuToggle");
    const nav = $("#mobileNav");
    if (!toggle || !nav) return;

    const getFocusable = () => $$("a[href], button:not([disabled])", nav).filter((el) => el.getClientRects().length > 0);

    const setOpen = (open, restoreFocus = true) => {
      toggle.classList.toggle("is-open", open);
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      const label = open ? "关闭菜单" : "打开菜单";
      toggle.setAttribute("aria-label", label);
      text("#menuToggleLabel", label);
      document.body.classList.toggle("is-nav-open", open);

      if (open) {
        window.setTimeout(() => {
          const first = getFocusable()[0];
          if (first) first.focus();
        }, 60);
      } else if (restoreFocus) {
        toggle.focus();
      }
    };

    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    $$("a", nav).forEach((link) => link.addEventListener("click", () => setOpen(false, false)));

    window.addEventListener("keydown", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- 照片卡片微动效 ---------- */
  function initPhotoTilt() {
    if (isTouch || prefersReducedMotion) return;

    $$(".photo-card__button").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty("--tilt-x", `${(-y * 2.2).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${(x * 2.2).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      });
    });
  }

  /* ---------- 照片放大 ---------- */
  function initLightbox() {
    const lightbox = $("#lightbox");
    const image = $("#lightboxImage");
    const caption = $("#lightboxCaption");
    const counter = $("#lightboxCounter");
    const loader = $("#lightboxLoader");
    if (!lightbox || !image) return;

    const buttons = $$("[data-full]");
    const items = buttons.map((button) => ({
      src: button.dataset.full,
      alt: $("img", button)?.alt || "",
      label: $(".photo-card__overlay span", button)?.textContent || ""
    }));

    let current = 0;
    let touchStartX = 0;
    let lastFocused = null;

    const render = () => {
      const item = items[current];
      if (loader) loader.hidden = false;
      image.src = item.src;
      image.alt = item.alt;
      caption.textContent = item.label;
      counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };

    image.addEventListener("load", () => {
      if (loader) loader.hidden = true;
    });
    image.addEventListener("error", () => {
      if (loader) loader.hidden = true;
    });

    const open = (index) => {
      current = (index + items.length) % items.length;
      if (lightbox.hidden) lastFocused = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add("is-lightbox-open");
      render();
      $("#lightboxClose").focus();
    };

    const close = () => {
      lightbox.hidden = true;
      if (loader) loader.hidden = true;
      document.body.classList.remove("is-lightbox-open");
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
      lastFocused = null;
    };

    const show = (offset) => open(current + offset);

    buttons.forEach((button, index) => button.addEventListener("click", () => open(index)));
    $("#lightboxClose").addEventListener("click", close);
    $("#lightboxPrev").addEventListener("click", () => show(-1));
    $("#lightboxNext").addEventListener("click", () => show(1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) close();
    });

    lightbox.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      (event) => {
        const endX = event.changedTouches[0].clientX;
        const distance = endX - touchStartX;
        if (Math.abs(distance) > 48) show(distance > 0 ? -1 : 1);
      },
      { passive: true }
    );

    window.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (event.key === "ArrowLeft") show(-1);
      if (event.key === "ArrowRight") show(1);
      if (event.key !== "Tab") return;

      const focusable = $$("button:not([disabled])", lightbox).filter((el) => el.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* ---------- 复制与提示 ---------- */
  const toast = $("#toast");
  const toastText = $("#toastText");
  let toastTimer = null;

  function showToast(message) {
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.setAttribute("aria-hidden", "false");
    toast.classList.remove("is-show");
    window.clearTimeout(toastTimer);
    void toast.offsetWidth;
    toast.classList.add("is-show");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-show");
      toast.setAttribute("aria-hidden", "true");
    }, 2200);
  }

  async function copyText(value, message = "已复制") {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    showToast(message);
  }

  function initCopyActions() {
    const copyAddress = $("#copyAddress");
    const copyRsvpAddress = $("#copyRsvpAddress");
    const tip = $("#rsvpTip");
    const addressText = `${config.locationName || ""} ${config.locationDetail || ""}`.trim();

    if (copyAddress) {
      copyAddress.addEventListener("click", () => copyText(addressText, "地址已复制"));
    }

    if (copyRsvpAddress) {
      copyRsvpAddress.addEventListener("click", () => {
        copyText(addressText, "宴会地址已复制");
        if (tip) {
          tip.classList.add("is-copied");
          const span = tip.querySelector("span");
          if (span) span.textContent = "地址已复制，期待与您相见。";
        }
      });
    }
  }

  function initRsvp() {
    const send = $("#sendRsvp");
    const nameInput = $("#rsvpName");
    const noteInput = $("#rsvpNote");
    const tip = $("#rsvpTip");
    const formLink = $("#rsvpFormLink");
    const statusButtons = $$("[data-rsvp-status]");
    let selectedStatus = statusButtons[0]?.dataset.rsvpStatus || "我会出席";

    const setTip = (message) => {
      if (!tip) return;
      tip.classList.add("is-copied");
      const span = tip.querySelector("span");
      if (span) span.textContent = message;
    };

    statusButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectedStatus = button.dataset.rsvpStatus || selectedStatus;
        statusButtons.forEach((item) => {
          const selected = item === button;
          item.classList.toggle("is-selected", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
      });
    });

    if (formLink && config.rsvpUrl) {
      formLink.href = config.rsvpUrl;
      formLink.hidden = false;
    }

    if (send && config.rsvpUrl) {
      const span = send.querySelector("span");
      if (span) span.textContent = "填写在线回执";
    }

    if (!send) return;
    send.addEventListener("click", async () => {
      if (config.rsvpUrl) {
        window.open(config.rsvpUrl, "_blank", "noopener");
        return;
      }

      const name = nameInput ? nameInput.value.trim() : "";
      const note = noteInput ? noteInput.value.trim() : "";
      const hostName = config.host ? config.host.replace("邀请人：", "") : "邀请人";
      const message = [
        `${hostName}，您好！`,
        `我是${name || "宾客"}，${selectedStatus}10月2日的订婚宴。`,
        note ? `备注：${note}` : "",
        "期待与您相见。"
      ].filter(Boolean).join("\n");

      await copyText(message, "回执内容已复制");
      setTip("回执内容已复制，请发送给邀请人。");

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${config.monogram || "订婚宴"} · 回执`,
            text: message
          });
          showToast("回执已复制并打开分享");
          return;
        } catch (error) {
          if (error && error.name === "AbortError") return;
        }
      }
    });
  }

  /* ---------- 初始化 ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    applyConfig();
    splitText();
    initPreloader();
    initReveals();
    initCountdown();
    initPetals();
    initScrollEffects();
    initNavigation();
    initPhotoTilt();
    initLightbox();
    initCopyActions();
    initRsvp();

    if (previewMode) {
      const targetSection = previewParams.get("section");
      if (targetSection) {
        document.documentElement.style.scrollBehavior = "auto";
        window.requestAnimationFrame(() => {
          const section = document.getElementById(targetSection);
          if (section) {
            window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
          }
        });
      }
    }

  });
})();
