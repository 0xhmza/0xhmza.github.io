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

  // The artwork itself is pure CSS (see .project-art in _layout.scss); this only
  // seeds its palette, placement and timing so each project keeps its own light.
  document.querySelectorAll(".project-card[data-project-title]").forEach(card => {
    const seed = hash(card.dataset.projectTitle.normalize("NFC") + "\0" + card.dataset.projectCreated);
    const random = randomFrom(seed);
    const between = (min, max) => min + random() * (max - min);
    const percent = (min, max) => `${between(min, max).toFixed(1)}%`;

    // A primary hue, a far counterpoint for contrast, and a near neighbour that blends them.
    // Yellow-olive hues turn muddy at low opacity on the dark surface, so they are folded into green.
    const clean = h => Math.round((h %= 360) > 45 && h < 100 ? h + 55 : h);
    // An optional front-matter `hue` pins the primary colour; the seed is still drawn so
    // everything else about the piece stays the same either way.
    const seededHue = random() * 360;
    const pinnedHue = parseFloat(card.dataset.projectHue);
    const hue = Number.isFinite(pinnedHue) ? pinnedHue : seededHue;
    const hues = [hue, hue + between(110, 170), hue + between(35, 60)].map(clean);
    const vars = {
      "--art-a": `hsl(${hues[0]} 78% 60% / .26)`,
      "--art-b": `hsl(${hues[1]} 72% 55% / .22)`,
      "--art-c": `hsl(${hues[2]} 80% 62% / .16)`,
      "--art-accent": `hsl(${hues[0]} 85% 74%)`,
      "--art-ax": percent(25, 45), "--art-ay": percent(30, 45),
      "--art-bx": percent(55, 75), "--art-by": percent(45, 60),
      "--art-cx": percent(40, 60), "--art-cy": percent(35, 55),
      "--art-ta": `${between(12, 17).toFixed(1)}s`, "--art-tb": `${between(15, 21).toFixed(1)}s`,
      "--art-delay": `${(-random() * 20).toFixed(1)}s`
    };
    for (const [name, value] of Object.entries(vars)) card.style.setProperty(name, value);
    card.dataset.artSeed = seed.toString(16).padStart(8, "0");
  });
})();
