(() => {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const year = document.querySelector("#year");
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".site-nav a");
  const serviceItems = document.querySelectorAll(".service-list li");
  const aboutItems = document.querySelectorAll(".about-points li");
  const revealItems = document.querySelectorAll(".reveal");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const heroMedia = document.querySelector(".hero-media");
  const heroVideo = document.querySelector(".hero-video");
  if (heroMedia && heroVideo) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const posterHoldMs = 2400;
    const startedAt = performance.now();
    let playTimer = 0;
    let revealTimer = 0;
    let revealed = false;
    let isPlaying = false;

    const revealPoster = () => {
      if (revealed || reduceMotion.matches || !isPlaying) return;
      revealed = true;
      if (revealTimer) window.clearTimeout(revealTimer);
      heroMedia.classList.add("is-video-ready");
      window.removeEventListener("touchstart", retryPlay, true);
      window.removeEventListener("click", retryPlay, true);
      window.removeEventListener("scroll", retryPlay, true);
    };

    const scheduleReveal = () => {
      if (revealed || reduceMotion.matches || !isPlaying) return;
      const wait = Math.max(0, posterHoldMs - (performance.now() - startedAt));
      if (revealTimer) window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(revealPoster, wait);
    };

    const tryPlay = () => {
      if (revealed || reduceMotion.matches) return false;
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.playsInline = true;
      heroVideo.setAttribute("muted", "");
      heroVideo.setAttribute("playsinline", "");
      const playPromise = heroVideo.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            isPlaying = true;
            scheduleReveal();
          })
          .catch(() => {});
        return true;
      }
      if (!heroVideo.paused) {
        isPlaying = true;
        scheduleReveal();
        return true;
      }
      return false;
    };

    const schedulePlay = () => {
      if (revealed || reduceMotion.matches) return;
      if (playTimer) window.clearTimeout(playTimer);
      // 裏で早めに再生開始し、静止画は posterHoldMs まで残す
      playTimer = window.setTimeout(tryPlay, 120);
    };

    const retryPlay = () => {
      tryPlay();
    };

    const syncHeroVideo = () => {
      if (reduceMotion.matches) {
        heroVideo.pause();
        heroMedia.classList.remove("is-video-ready");
        revealed = false;
        isPlaying = false;
        return;
      }
      schedulePlay();
    };

    // 再生はすぐ開始しつつ、静止画フェードは最短 2.4 秒後
    heroVideo.addEventListener("playing", () => {
      isPlaying = true;
      scheduleReveal();
    });
    heroVideo.addEventListener("loadeddata", schedulePlay);
    heroVideo.addEventListener("canplay", schedulePlay);
    window.addEventListener("touchstart", retryPlay, { passive: true, capture: true });
    window.addEventListener("click", retryPlay, { passive: true, capture: true });
    window.addEventListener("scroll", retryPlay, { passive: true, capture: true });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") tryPlay();
    });

    try {
      heroVideo.load();
    } catch {
      /* ignore */
    }
    syncHeroVideo();
    reduceMotion.addEventListener("change", syncHeroVideo);
  }

  const closeNav = () => {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "メニューを開く");
    document.body.classList.remove("nav-open");
  };

  const openNav = () => {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "メニューを閉じる");
    document.body.classList.add("nav-open");
  };

  toggle?.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) {
      closeNav();
    } else {
      openNav();
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      closeNav();
    }
  });

  const updateActiveNav = () => {
    const offset = window.scrollY + (header?.offsetHeight || 0) + 40;
    let currentId = "";

    sections.forEach((section) => {
      if (section.offsetTop <= offset) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const id = href.startsWith("#") ? href.slice(1) : "";
      link.classList.toggle("is-active", id === currentId);
    });
  };

  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    const observeStagger = (items, step) => {
      items.forEach((item, index) => {
        item.style.transitionDelay = `${index * step}ms`;
        observer.observe(item);
      });
    };

    observeStagger(aboutItems, 100);
    observeStagger(serviceItems, 90);

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 50, 200)}ms`;
      observer.observe(item);
    });
  } else {
    aboutItems.forEach((item) => item.classList.add("is-visible"));
    serviceItems.forEach((item) => item.classList.add("is-visible"));
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
