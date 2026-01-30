(() => {
  // Theme switch
  const body = document.body;
  const lamp = document.getElementById("mode");

  const toggleTheme = (state) => {
    if (state === "dark") {
      localStorage.setItem("theme", "light");
      body.removeAttribute("data-theme");
    } else if (state === "light") {
      localStorage.setItem("theme", "dark");
      body.setAttribute("data-theme", "dark");
    } else {
      initTheme(state);
    }
  };

  lamp.addEventListener("click", () =>
    toggleTheme(localStorage.getItem("theme"))
  );

  // Blur the content when the menu is open
  const cbox = document.getElementById("menu-trigger");

  cbox.addEventListener("change", function () {
    const area = document.querySelector(".wrapper");
    this.checked
      ? area.classList.add("blurry")
      : area.classList.remove("blurry");
  });

  const hashString = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash >>> 0;
  };

  const mulberry32 = (seed) => {
    let t = seed + 0x6d2b79f5;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };

  const shuffle = (arr, rng) => {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const applyGradients = () => {
    const gradientNodes = document.querySelectorAll(".js-gradient[data-gradient]");
    if (!gradientNodes.length) return;

    const fallbackGradients = [
      ["#0f2027", "#203a43", "#2c5364"],
      ["#0b132b", "#1c2541", "#3a506b"],
      ["#1e3c72", "#2a5298", "#1e2b4f"],
    ];

    gradientNodes.forEach((node, index) => {
      const raw = (node.dataset.gradient || "").trim();
      const colors = raw
        .split(",")
        .map((color) => color.trim())
        .filter(Boolean);

      const palette =
        colors.length >= 2
          ? colors
          : fallbackGradients[index % fallbackGradients.length];

      const seedSource =
        colors.length >= 2
          ? colors.join(",")
          : `${window.location.pathname}-${index}`;
      const rng = mulberry32(hashString(seedSource));
      const angle = Math.floor(rng() * 360);
      const stops = shuffle([...palette], rng);
      const stopParts = stops.map((color, i) => {
        const pct = stops.length === 1 ? 0 : Math.round((i / (stops.length - 1)) * 100);
        return `${color} ${pct}%`;
      });

      node.style.backgroundImage = `linear-gradient(${angle}deg, ${stopParts.join(", ")})`;
    });
  };

  const getMermaidThemeConfig = () => {
    const isDark = body.getAttribute("data-theme") === "dark";
    const themeVariables = isDark
      ? {
          background: "transparent",
          primaryColor: "#0f1620",
          primaryBorderColor: "#2b3542",
          primaryTextColor: "#e6edf3",
          lineColor: "#6c7684",
          secondaryColor: "#121b25",
          tertiaryColor: "#0c121a",
          textColor: "#e6edf3",
          clusterBkg: "#0f1620",
          clusterBorder: "#2b3542",
          edgeLabelBackground: "#0b1016",
          fontFamily: "inherit",
        }
      : {
          background: "transparent",
          primaryColor: "#f6f8fb",
          primaryBorderColor: "#cfd7e3",
          primaryTextColor: "#1f2933",
          lineColor: "#56616f",
          secondaryColor: "#eef2f7",
          tertiaryColor: "#e4e9f1",
          textColor: "#1f2933",
          clusterBkg: "#f3f6fb",
          clusterBorder: "#cfd7e3",
          edgeLabelBackground: "#ffffff",
          fontFamily: "inherit",
        };

    return {
      theme: "base",
      themeVariables,
    };
  };

  const renderMermaid = () => {
    if (!window.mermaid) return;
    const nodes = document.querySelectorAll(".mermaid");
    if (!nodes.length) return;

    nodes.forEach((node) => {
      const source = node.dataset.source || node.textContent;
      if (!source) return;
      node.dataset.source = source;
      node.removeAttribute("data-processed");
      node.innerHTML = "";
      node.textContent = source;
    });

    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      flowchart: {
        padding: 15,
      },
      ...getMermaidThemeConfig(),
    });
    window.mermaid.run({ nodes });
  };

  const initMermaid = () => {
    if (!window.mermaid) return;
    const codeBlocks = document.querySelectorAll("pre > code.language-mermaid");
    if (!codeBlocks.length && !document.querySelector(".mermaid")) return;

    codeBlocks.forEach((code) => {
      const pre = code.parentElement;
      const wrapper = pre && pre.parentElement;
      const container = document.createElement("div");
      container.className = "mermaid";
      container.dataset.source = code.textContent;
      container.textContent = code.textContent;

      if (wrapper && wrapper.classList.contains("highlight")) {
        wrapper.replaceWith(container);
      } else if (pre) {
        pre.replaceWith(container);
      }
    });

    renderMermaid();
  };

  const observeMermaidTheme = () => {
    if (!body || !window.MutationObserver) return;
    let currentTheme = body.getAttribute("data-theme");
    const observer = new MutationObserver(() => {
      const nextTheme = body.getAttribute("data-theme");
      if (nextTheme !== currentTheme) {
        currentTheme = nextTheme;
        renderMermaid();
      }
    });
    observer.observe(body, { attributes: true, attributeFilter: ["data-theme"] });
  };

  applyGradients();
  initMermaid();
  observeMermaidTheme();
})();
