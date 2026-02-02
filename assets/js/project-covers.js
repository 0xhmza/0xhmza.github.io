(() => {
  const covers = document.querySelectorAll(".project-cover[data-title]");
  if (!covers.length) {
    return;
  }

  const MASK_DARK = 0.55;
  const MASK_LIGHT = 0.12;
  const isGrayscale = false;
  const BLUR_DARK = 30;
  const BLUR_LIGHT = 22;
  const SHAPE_COUNT = 3;
  const shapeFallbackPalette = [
    "#2d3436",
    "#4a4e69",
    "#22223b",
    "#3d5a80",
    "#2f3e46",
    "#1b263b",
    "#540d6e",
    "#3bceac",
  ];
  const DARK_BGS = ["#0b0d17", "#10141e", "#14171f", "#1a1a1d"];
  const LIGHT_BGS = ["#f5f8ff", "#f8f3f7", "#f4f7f2", "#f7f6ef"];
  const fallbackGradientsDark = [
    ["#0f2027", "#203a43", "#2c5364"],
    ["#0b132b", "#1c2541", "#3a506b"],
    ["#1e3c72", "#2a5298", "#1e2b4f"],
  ];
  const fallbackGradientsLight = [
    ["#ff8c8c", "#ffd166", "#76c7f2"],
    ["#a78bfa", "#f472b6", "#f59e0b"],
    ["#34d399", "#60a5fa", "#f97316"],
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

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const hexToRgb = (hex) => {
    const cleaned = hex.replace("#", "").trim();
    if (![3, 6].includes(cleaned.length)) return null;
    const full =
      cleaned.length === 3
        ? cleaned
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : cleaned;
    const num = Number.parseInt(full, 16);
    if (Number.isNaN(num)) return null;
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const rgbToHex = (r, g, b) =>
    `#${[r, g, b]
      .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0"))
      .join("")}`;

  const rgbToHsl = ({ r, g, b }) => {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    if (delta !== 0) {
      if (max === rn) {
        h = ((gn - bn) / delta) % 6;
      } else if (max === gn) {
        h = (bn - rn) / delta + 2;
      } else {
        h = (rn - gn) / delta + 4;
      }
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }
    const l = (max + min) / 2;
    const s =
      delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    return { h, s: s * 100, l: l * 100 };
  };

  const hslToRgb = ({ h, s, l }) => {
    const sn = clamp(s, 0, 100) / 100;
    const ln = clamp(l, 0, 100) / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = ln - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }
    return {
      r: (r + m) * 255,
      g: (g + m) * 255,
      b: (b + m) * 255,
    };
  };

  const jitterColor = (color, rand, isDark) => {
    if (!color || !color.startsWith("#")) return color;
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    const hsl = rgbToHsl(rgb);
    const hueShift = randomBetween(rand, -12, 12);
    const satShift = randomBetween(rand, isDark ? -8 : 4, isDark ? 10 : 22);
    const lightShift = randomBetween(rand, isDark ? -6 : -12, isDark ? 6 : 6);
    const next = {
      h: (hsl.h + hueShift + 360) % 360,
      s: clamp(hsl.s + satShift, isDark ? 12 : 28, isDark ? 92 : 96),
      l: clamp(hsl.l + lightShift, isDark ? 14 : 18, isDark ? 70 : 78),
    };
    return rgbToHex(...Object.values(hslToRgb(next)));
  };

  const shufflePalette = (palette, rand) => {
    const copy = [...palette];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const diversifyPalette = (palette, rand, isDark) =>
    shufflePalette(palette, rand).map((color) => jitterColor(color, rand, isDark));

  const mixWithWhite = (color, amount) => {
    if (!color || !color.startsWith("#")) return color;
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    const mix = (channel) => channel + (255 - channel) * amount;
    return rgbToHex(mix(rgb.r), mix(rgb.g), mix(rgb.b));
  };

  const getCoverPalette = (cover, seed) => {
    const dark = parseGradient(cover.dataset.gradientDark || "");
    const light = parseGradient(cover.dataset.gradientLight || "");
    const isDark = document.body.getAttribute("data-theme") === "dark";
    const fallbackDark =
      fallbackGradientsDark[seed % fallbackGradientsDark.length];
    const fallbackLight =
      fallbackGradientsLight[seed % fallbackGradientsLight.length];
    const darkPalette = dark.length >= 2 ? dark : fallbackDark;
    const lightPalette = light.length >= 2 ? light : fallbackLight;
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

  const renderCover = (cover) => {
    const titleText = cover.dataset.title || "";
    const dateText = cover.dataset.date || "";
    const seed = getSeed(cover, titleText, dateText);
    const rand = mulberry32(seed);
    const isDark = document.body.getAttribute("data-theme") === "dark";

    const palette = getCoverPalette(cover, seed);
    const diversified = diversifyPalette(palette, rand, isDark);
    const lightenedPalette = isDark
      ? diversified
      : diversified.map((color) => mixWithWhite(color, 0.3));
    const gradient = buildGradient(lightenedPalette, seed);

    const coverBg = isGrayscale
      ? `rgb(${Math.floor(randomBetween(rand, 20, 40))}, ${Math.floor(
          randomBetween(rand, 20, 40)
        )}, ${Math.floor(randomBetween(rand, 20, 40))})`
      : (isDark ? DARK_BGS : LIGHT_BGS)[
          Math.floor(
            randomBetween(
              rand,
              0,
              isDark ? DARK_BGS.length : LIGHT_BGS.length
            )
          )
        ];

    const maskValue = isDark ? MASK_DARK : MASK_LIGHT;
    const maskColor = isDark
      ? "rgba(0, 0, 0, 0.55)"
      : "rgba(255, 255, 255, 0.45)";
    const shapeOpacity = isDark ? 0.82 : 0.62;
    const shapeBlend = isDark ? "screen" : "multiply";
    const saturation = isDark ? 1.25 : 1.2;
    const artOpacity = isDark ? 1 : 1;
    const blurAmount = isDark ? BLUR_DARK : BLUR_LIGHT;
    const titleColor = isDark ? "#f8fafc" : "#0d122b";
    const dateColor = isDark ? "rgba(255, 255, 255, 0.72)" : "rgba(13, 18, 43, 0.68)";

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
    cover.style.setProperty("--cover-mask", maskValue.toFixed(2));
    cover.style.setProperty("--cover-mask-color", maskColor);
    cover.style.setProperty("--cover-blur", `${blurAmount}px`);
    cover.style.setProperty("--cover-shape-opacity", shapeOpacity.toFixed(2));
    cover.style.setProperty("--cover-shape-blend", shapeBlend);
    cover.style.setProperty("--cover-saturation", saturation.toFixed(2));
    cover.style.setProperty("--cover-art-opacity", artOpacity.toFixed(2));
    cover.style.setProperty("--cover-title-color", titleColor);
    cover.style.setProperty("--cover-date-color", dateColor);
    if (gradient) {
      cover.style.setProperty("--cover-gradient", gradient);
    } else {
      cover.style.removeProperty("--cover-gradient");
    }

    const shapesHost = cover.querySelector(".project-cover__shapes");
    const baseShapePalette = diversified.length ? diversified : shapeFallbackPalette;
    const shapePalette = isDark
      ? baseShapePalette
      : baseShapePalette.map((color) => mixWithWhite(color, 0.3));
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
    covers.forEach((cover) => renderCover(cover));
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
