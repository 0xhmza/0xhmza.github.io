// One renderer for authored figures and ordinary Mermaid fences.
// Tiny supports the site's flowcharts and sequence diagrams without ELK/KaTeX.
const MERMAID_URL = "https://cdn.jsdelivr.net/npm/@mermaid-js/tiny@12.0.0/dist/mermaid.tiny.js";
let library;
let renderQueue = Promise.resolve();
let renderId = 0;
let active = null;
let zoom = 1;
let naturalWidth = 800;
let returnFocus;
const entries = [];

function loadMermaid() {
  if (!library) {
    library = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = MERMAID_URL;
      script.onload = () => window.mermaid ? resolve(window.mermaid) : reject(new Error("Renderer unavailable"));
      script.onerror = () => reject(new Error("Renderer could not load"));
      document.head.append(script);
    });
  }
  return library;
}

function diagramConfig() {
  const styles = getComputedStyle(document.documentElement);
  const color = (name) => styles.getPropertyValue(name).trim();
  const text = color("--text");
  const surface = color("--surface");
  const border = color("--muted");
  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeCSS: ".node rect, .node polygon, .node path, .note { filter: none !important; } rect.actor { rx: 0; ry: 0; }",
    fontFamily: "Segoe UI, Arial, sans-serif",
    flowchart: { htmlLabels: false, curve: "linear", padding: 18, nodeSpacing: 30, rankSpacing: 40, useMaxWidth: true },
    sequence: { useMaxWidth: true, wrap: true, mirrorActors: false, actorMargin: 35, messageMargin: 35, actorFontSize: parseFloat(styles.fontSize), messageFontSize: parseFloat(styles.fontSize), noteFontSize: parseFloat(styles.fontSize) },
    themeVariables: {
      darkMode: true, background: surface,
      primaryColor: surface, primaryTextColor: text, primaryBorderColor: border,
      secondaryColor: surface, tertiaryColor: surface, lineColor: border,
      textColor: text, nodeTextColor: text, fontSize: styles.fontSize,
      mainBkg: surface, clusterBkg: surface, clusterBorder: border,
      edgeLabelBackground: surface,
      actorBkg: surface, actorBorder: border, actorTextColor: text,
      actorLineColor: border, signalColor: text, signalTextColor: text,
      labelBoxBkgColor: surface, labelBoxBorderColor: border, labelTextColor: text,
      loopTextColor: text, noteBkgColor: surface, noteTextColor: text, noteBorderColor: border
    }
  };
}

function button(label, action) {
  const node = document.createElement("button");
  node.type = "button";
  node.textContent = label;
  node.addEventListener("click", action);
  return node;
}

// Native dialog supplies focus trapping, Escape dismissal and background inertness.
const dialog = document.createElement("dialog");
dialog.className = "diagram-dialog";
dialog.setAttribute("aria-labelledby", "diagram-dialog-title");
dialog.innerHTML = '<div class="diagram-dialog-header"><strong id="diagram-dialog-title"></strong><div class="diagram-dialog-controls"></div></div><div class="diagram-dialog-content" tabindex="0" aria-label="Scrollable diagram"></div>';
const dialogTitle = dialog.querySelector("strong");
const controls = dialog.querySelector(".diagram-dialog-controls");
const dialogContent = dialog.querySelector(".diagram-dialog-content");
const scale = document.createElement("output");
scale.setAttribute("aria-label", "Diagram zoom");
const updateZoom = (value) => {
  zoom = Math.max(.25, Math.min(3, value));
  const svg = dialogContent.querySelector("svg");
  if (svg) svg.style.width = Math.round(naturalWidth * zoom) + "px";
  scale.textContent = Math.round(zoom * 100) + "%";
};
const zoomOut = button("−", () => updateZoom(zoom - .25));
zoomOut.setAttribute("aria-label", "Zoom out");
const zoomIn = button("+", () => updateZoom(zoom + .25));
zoomIn.setAttribute("aria-label", "Zoom in");
const fit = button("Fit", () => updateZoom(Math.min(1, (dialogContent.clientWidth - 48) / naturalWidth)));
const close = button("Close ×", closeDiagram);
controls.append(zoomOut, scale, zoomIn, fit, close);
document.body.append(dialog);
dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDiagram(); });
dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDiagram(); });
dialog.addEventListener("close", () => { if (!dialog.open) restoreDiagram(); });

function restoreDiagram() {
  if (!active) return;
  const svg = dialogContent.querySelector("svg");
  if (svg) {
    svg.style.width = "100%";
    active.canvas.append(svg);
  }
  active = null;
  returnFocus?.focus();
}

function closeDiagram() {
  dialog.close();
  // Restore synchronously: the native close event is queued until a later task.
  // A second expansion must never see a stranded SVG.
  restoreDiagram();
}

function open(entry) {
  if (typeof dialog.showModal !== "function") return;
  const svg = entry.canvas.querySelector("svg");
  if (!svg) return;
  active = entry;
  returnFocus = entry.expand;
  naturalWidth = svg.viewBox.baseVal.width || 800;
  dialogTitle.textContent = entry.title;
  dialogContent.replaceChildren(svg);
  dialog.showModal();
  updateZoom(Math.min(1, (dialogContent.clientWidth - 48) / naturalWidth));
  close.focus();
}

function render(entry) {
  // Mermaid uses shared state; render one diagram at a time.
  renderQueue = renderQueue.then(async () => {
    try {
      const mermaid = await loadMermaid();
      await document.fonts.ready;
      mermaid.initialize(diagramConfig());
      const { svg } = await mermaid.render("diagram-svg-" + (++renderId), entry.source);
      entry.canvas.innerHTML = svg;
      entry.canvas.hidden = false;
      entry.status.hidden = true;
      entry.toolbar.hidden = false;
      entry.details.open = false;
      const image = entry.canvas.querySelector("svg");
      image.setAttribute("role", "img");
      if (!image.querySelector("title")) image.setAttribute("aria-label", entry.title);
    } catch (_) {
      entry.status.textContent = "The diagram could not load. Its description and source are available below.";
      entry.status.hidden = false;
      entry.details.open = true;
      entry.toolbar.hidden = true;
    }
  });
}

const sources = new Set([...document.querySelectorAll("pre.mermaid, pre > code.language-mermaid, .language-mermaid pre")]
  .map((node) => node.matches("pre") ? node : node.parentElement));
[...sources].forEach((pre, index) => {
  const source = pre.textContent.trim();
  let figure = pre.closest("figure.diagram");
  if (!figure) {
    figure = document.createElement("figure");
    figure.className = "diagram";
    const host = pre.closest("div.highlighter-rouge") || pre.closest("div.highlight") || pre;
    host.before(figure);
    const caption = document.createElement("figcaption");
    const title = source.match(/^\s*accTitle:\s*(.+)$/m)?.[1] || "Concept diagram";
    const description = source.match(/^\s*accDescr:\s*(.+)$/m)?.[1];
    caption.textContent = title + (description ? ". " + description : "");
    figure.append(caption);
    host.remove();
  }
  const caption = figure.querySelector("figcaption");
  const title = source.match(/^\s*accTitle:\s*(.+)$/m)?.[1] || "Diagram " + (index + 1);
  const label = document.createElement("span");
  label.className = "diagram-label";
  label.textContent = "Figure " + String(index + 1).padStart(2, "0");
  caption.prepend(label);
  const toolbar = document.createElement("div");
  toolbar.className = "diagram-toolbar";
  toolbar.hidden = true;
  const hint = document.createElement("span");
  hint.textContent = "Explore the diagram";
  const canvas = document.createElement("div");
  canvas.className = "diagram-canvas";
  canvas.hidden = true;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "region");
  canvas.setAttribute("aria-label", title + " — scroll to explore");
  const details = document.createElement("details");
  details.className = "diagram-source";
  const summary = document.createElement("summary");
  summary.textContent = "Diagram source";
  const sourcePre = document.createElement("pre");
  const sourceCode = document.createElement("code");
  sourceCode.textContent = source;
  sourcePre.append(sourceCode);
  details.append(summary, sourcePre);
  const status = document.createElement("p");
  status.className = "diagram-status";
  status.setAttribute("role", "status");
  status.textContent = "Diagram loads as you approach. You can also read its source.";
  const entry = { source, title, canvas, details, status, toolbar, loaded: false };
  const expand = button("Expand ↗", () => open(entry));
  expand.setAttribute("aria-label", "Expand " + title);
  expand.hidden = typeof dialog.showModal !== "function";
  entry.expand = expand;
  toolbar.append(hint, expand);
  pre.remove();
  figure.append(toolbar, canvas, status, details);
  entry.figure = figure;
  entries.push(entry);
});

const load = (entry) => { entry.loaded = true; render(entry); };
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((observations) => {
    observations.forEach((observation) => {
      if (!observation.isIntersecting) return;
      const entry = entries.find((item) => item.figure === observation.target);
      observer.unobserve(observation.target);
      load(entry);
    });
  }, { rootMargin: "500px" });
  entries.forEach((entry) => observer.observe(entry.figure));
} else entries.forEach(load);

window.addEventListener("beforeprint", () => entries.filter((entry) => !entry.loaded).forEach(load));
