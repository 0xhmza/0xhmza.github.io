(() => {
  "use strict";

  // FNV-1a over UTF-8. A delimiter keeps title/date pairs unambiguous.
  function hash(value) {
    let result = 0x811c9dc5;
    for (const byte of new TextEncoder().encode(value)) {
      result = Math.imul(result ^ byte, 0x01000193);
    }
    return result >>> 0;
  }

  function randomFrom(seed) {
    return () => {
      let value = seed += 0x6d2b79f5;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  const ns = "http://www.w3.org/2000/svg";
  function element(name, attributes) {
    const node = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  }

  document.querySelectorAll(".project-card[data-project-title]").forEach((card, index) => {
    const art = card.querySelector(".project-art");
    if (!art || art.childElementCount) return;
    const seed = hash(card.dataset.projectTitle.normalize("NFC") + "\0" + card.dataset.projectCreated);
    const random = randomFrom(seed);
    const id = `metal-${seed.toString(16)}-${index}`;
    const svg = element("svg", { viewBox: "0 0 600 360", fill: "none", focusable: "false" });
    const defs = element("defs", {});
    const gradient = element("linearGradient", { id, x1: "0%", y1: "0%", x2: "100%", y2: "100%" });
    for (const [offset, color] of [[0, "#c2cfdf"], [.45, "#65778e"], [1, "#263444"]]) {
      gradient.append(element("stop", { offset, "stop-color": color }));
    }
    defs.append(gradient);
    svg.append(defs);

    // Seeded height fields form a small architectural landscape. Draw back to front
    // so every solid occludes its neighbours without a canvas or 3D dependency.
    const peaks = Array.from({ length: 3 }, () => ({
      x: 1 + random() * 6, y: 1 + random() * 6,
      height: 45 + random() * 90, spread: 2 + random() * 6
    }));
    const phase = random() * Math.PI * 2;
    const pitch = 20 + random() * 5;
    const gap = 2.4;
    const project = (x, y, z = 0) => [300 + (x - y) * pitch, 95 + (x + y) * pitch * .48 - z];
    const shape = (points, attributes) => element("path", {
      d: points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ") + " Z",
      ...attributes
    });
    const base = [project(-.5, -.5), project(8.5, -.5), project(8.5, 8.5), project(-.5, 8.5)];
    svg.append(shape(base, { fill: "#111922", stroke: "#647b9840", "stroke-width": .8 }));
    const blocks = [];
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const field = peaks.reduce((sum, peak) => sum + peak.height * Math.exp(-((x - peak.x) ** 2 + (y - peak.y) ** 2) / peak.spread), 0);
        const height = 8 + Math.round((field * .6 + Math.sin(x * .9 + y * .7 + phase) * 9) / 9) * 9;
        blocks.push({ x, y, height: Math.max(5, height), highlight: random() > .88 });
      }
    }
    const group = element("g", { "stroke-linejoin": "miter" });
    blocks.sort((a, b) => a.x + a.y - b.x - b.y).forEach(({ x, y, height, highlight }) => {
      const inset = gap / pitch;
      const a = project(x, y, height);
      const b = project(x + 1 - inset, y, height);
      const c = project(x + 1 - inset, y + 1 - inset, height);
      const d = project(x, y + 1 - inset, height);
      const bottomB = project(x + 1 - inset, y);
      const bottomC = project(x + 1 - inset, y + 1 - inset);
      const bottomD = project(x, y + 1 - inset);
      group.append(shape([d, c, bottomC, bottomD], { fill: "#192330", stroke: "#3b4a5d", "stroke-width": .6 }));
      group.append(shape([b, c, bottomC, bottomB], { fill: "#0d141d", stroke: "#29384a", "stroke-width": .6 }));
      group.append(shape([a, b, c, d], {
        fill: highlight ? "#adcae9" : `url(#${id})`,
        stroke: highlight ? "#e0edff" : "#8b9db480", "stroke-width": .65
      }));
      if (highlight) {
        group.append(element("path", {
          d: `M${d.join(",")} L${c.join(",")} L${bottomC.join(",")}`,
          stroke: "#a9d2ff", "stroke-opacity": .8, "stroke-width": 1, fill: "none"
        }));
      }
    });
    svg.append(group);
    art.append(svg);
    card.dataset.artSeed = seed.toString(16).padStart(8, "0");
  });
})();
