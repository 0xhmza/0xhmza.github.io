(() => {
  const covers = document.querySelectorAll(".project-cover[data-title]");
  if (!covers.length) {
    return;
  }

  const MASK_TRANSPARENCY = 0.5;
  const isGrayscale = false;
  const BLUR_AMOUNT = 28;
  const SHAPE_COUNT = 3;
  const sadPalette = [
    "#2d3436",
    "#4a4e69",
    "#22223b",
    "#3d5a80",
    "#2f3e46",
    "#1b263b",
    "#540d6e",
    "#3bceac",
  ];
  const sadBgs = ["#141414", "#1a1a1d", "#0b0d17", "#222"];
  const fallbackGradients = [
    ["#0f2027", "#203a43", "#2c5364"],
    ["#0b132b", "#1c2541", "#3a506b"],
    ["#1e3c72", "#2a5298", "#1e2b4f"],
  ];

  const stringToSeed = (value) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const mulberry32 = (seed) => {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  };

  const getSeed = (cover, titleText, dateText) => {
    const provided = Number.parseInt(cover.dataset.seed, 10);
    if (Number.isFinite(provided)) {
      return provided;
    }
    return stringToSeed(`${titleText}::${dateText}`);
  };

  const randomBetween = (rand, min, max) => min + (max - min) * rand();

  const parseGradient = (value) =>
    value
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);

  const getCoverPalette = (cover, fallbackIndex) => {
    const dark = parseGradient(cover.dataset.gradientDark || "");
    const light = parseGradient(cover.dataset.gradientLight || "");
    const fallback = fallbackGradients[fallbackIndex % fallbackGradients.length];
    const darkPalette = dark.length >= 2 ? dark : fallback;
    const lightPalette = light.length >= 2 ? light : fallback;
    const isDark = document.body.getAttribute("data-theme") === "dark";
    const basePalette = isDark ? darkPalette : lightPalette;
    return isDark ? basePalette : [...basePalette].reverse();
  };

  const buildGradient = (palette, seed) => {
    if (palette.length < 2) {
      return "";
    }
    const gradientRand = mulberry32(seed + 0x9e3779b9);
    const angle = Math.floor(randomBetween(gradientRand, 0, 360));
    return `linear-gradient(${angle}deg, ${palette.join(", ")})`;
  };

  const renderCover = (cover, index) => {
    const titleText = cover.dataset.title || "";
    const dateText = cover.dataset.date || "";
    const seed = getSeed(cover, titleText, dateText);
    const rand = mulberry32(seed);

    const palette = getCoverPalette(cover, index);
    const gradient = buildGradient(palette, seed);

    const coverBg = isGrayscale
      ? `rgb(${Math.floor(randomBetween(rand, 20, 40))}, ${Math.floor(
          randomBetween(rand, 20, 40)
        )}, ${Math.floor(randomBetween(rand, 20, 40))})`
      : sadBgs[Math.floor(randomBetween(rand, 0, sadBgs.length))];

    cover.innerHTML = `
      <div class="project-cover__art" aria-hidden="true">
        <div class="project-cover__shapes"></div>
        <div class="project-cover__mask"></div>
      </div>
      <div class="project-cover__text">
        <div class="project-cover__title"></div>
        <div class="project-cover__date"></div>
      </div>
    `;

    cover.style.setProperty("--cover-bg", coverBg);
    cover.style.setProperty("--cover-mask", MASK_TRANSPARENCY.toFixed(2));
    cover.style.setProperty("--cover-blur", `${BLUR_AMOUNT}px`);
    if (gradient) {
      cover.style.setProperty("--cover-gradient", gradient);
    } else {
      cover.style.removeProperty("--cover-gradient");
    }

    const shapesHost = cover.querySelector(".project-cover__shapes");
    const shapePalette = palette.length ? palette : sadPalette;
    for (let i = 0; i < SHAPE_COUNT; i += 1) {
      const shape = document.createElement("div");
      const useCircle = rand() > 0.5;
      const size = randomBetween(rand, 60, 140);
      const heightFactor = randomBetween(rand, 0.25, 0.7);

      const color = isGrayscale
        ? `rgb(${Math.floor(randomBetween(rand, 80, 180))}, ${Math.floor(
            randomBetween(rand, 80, 180)
          )}, ${Math.floor(randomBetween(rand, 80, 180))})`
        : shapePalette[Math.floor(randomBetween(rand, 0, shapePalette.length))];

      shape.className = "project-cover__shape";
      shape.style.background = color;
      shape.style.width = `${size}%`;
      shape.style.height = `${size * heightFactor}%`;
      shape.style.left = `${randomBetween(rand, -20, 100)}%`;
      shape.style.top = `${randomBetween(rand, -30, 100)}%`;
      shape.style.borderRadius = useCircle ? "999px" : "24%";
      shape.style.transform = `rotate(${Math.floor(
        randomBetween(rand, 0, 360)
      )}deg)`;
      shape.style.opacity = "0.8";
      shapesHost.appendChild(shape);
    }

    const titleEl = cover.querySelector(".project-cover__title");
    const dateEl = cover.querySelector(".project-cover__date");
    if (titleEl) {
      titleEl.textContent = titleText;
    }
    if (dateEl) {
      dateEl.textContent = dateText;
    }
  };

  const renderAll = () => {
    covers.forEach((cover, index) => renderCover(cover, index));
  };

  renderAll();

  const body = document.body;
  if (body && window.MutationObserver) {
    let currentTheme = body.getAttribute("data-theme");
    const observer = new MutationObserver(() => {
      const nextTheme = body.getAttribute("data-theme");
      if (nextTheme !== currentTheme) {
        currentTheme = nextTheme;
        renderAll();
      }
    });
    observer.observe(body, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
