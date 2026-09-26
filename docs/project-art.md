# Drifting light

Each card sits under two soft pools of coloured light that slowly drift, swell, and cross over each other, with a faint third tone blending between them. The piece is quiet, dark, and abstract, and it fades out before the title so the text stays easy to read.

The project title and creation date seed the palette: a primary hue, a counterpoint 110–170° away for contrast, and a near neighbour 35–60° away that softens the join. Yellow-olive hues look muddy at low opacity on the dark surface, so they are shifted into green. The seed also sets where each pool starts, how fast it moves, and where the cycle begins, so neighbouring cards never move in step. The primary hue also tints the card border and arrow on hover.

Pure hashing cannot promise that neighbouring projects look different. When two cards come out too similar, set `hue: 0–359` in the project's front matter to pin the primary colour. The rest of the piece stays seeded.

All motion is CSS. The two pools are oversized pseudo-elements that animate only `transform`, so the browser can composite them without repainting. Hover and keyboard focus raise the opacity. Reduced-motion settings stop the drift and keep a still gradient. Without JavaScript, a violet and teal default renders.

## Implementation

`assets/js/project-art.js` uses FNV-1a (32-bit) on UTF-8 bytes of `NFC(title) + NUL + YYYY-MM-DD`, then a Mulberry32 sequence. The date is the project's existing front-matter `date`, treated as its creation date. Keep it stable when editing a project. Changing either input changes the artwork; list order, viewport, and reloads do not change the geometry. This is a visual seed, not a cryptographic identifier.

The algorithmic-art skill's seeded process is adapted to the existing dark blog: native SVG, no separate branded viewer, external rendering library, or seed controls. HTML titles and links work without JavaScript; the CSS background provides a quiet fallback. The script loads only on pages containing project cards.
