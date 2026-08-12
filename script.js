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
