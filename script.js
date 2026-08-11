(() => {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const form = document.querySelector("#contact-form");
  const status = document.querySelector("#form-status");
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
  };

  const openNav = () => {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "メニューを閉じる");
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

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!status) return;

    status.classList.remove("is-error");
    status.textContent = "";

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !message) {
      status.classList.add("is-error");
      status.textContent = "必須項目をご入力ください。";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.classList.add("is-error");
      status.textContent = "メールアドレスの形式をご確認ください。";
      return;
    }

    status.textContent = "送信内容を受け付けました。担当よりご連絡いたします。";
    form.reset();
  });
})();
