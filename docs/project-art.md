# Machined landscapes

Each card holds a small architectural landscape suspended in darkness. Sharp metallic faces, deliberate gaps, and occasional icy highlights reference systems and precision engineering without badges or literal hardware illustrations.

The project title and creation date seed three overlapping height fields. Their positions, falloff, and amplitudes produce a distinct skyline. A quantized wave introduces terraces, while a restrained grid holds the composition together. The result is an ordered structure rather than arbitrary noise.

Isometric projection reveals three faces of each solid. Back-to-front drawing creates depth through actual occlusion; bright top faces and shadowed sides define the material. Sparse illuminated edges give the eye a path through the structure. The composition fades before the text so project descriptions remain easy to read.

A gentle change of scale on hover and keyboard focus brings each structure forward. Reduced-motion settings retain a still view. SVG paths stay crisp at any size, and the implementation needs no external library or continuous render loop.

## Implementation

`assets/js/project-art.js` uses FNV-1a (32-bit) on UTF-8 bytes of `NFC(title) + NUL + YYYY-MM-DD`, then a Mulberry32 sequence. The date is the project's existing front-matter `date`, treated as its creation date. Keep it stable when editing a project. Changing either input changes the artwork; list order, viewport, and reloads do not change the geometry. This is a visual seed, not a cryptographic identifier.

The algorithmic-art skill's seeded process is adapted to the existing dark blog: native SVG, no separate branded viewer, external rendering library, or seed controls. HTML titles and links work without JavaScript; the CSS background provides a quiet fallback. The script loads only on pages containing project cards.
