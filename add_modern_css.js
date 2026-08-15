import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf8');

const modernCss = `

/* ========================================================== */
/* MODERN UI: GLASSMORPHISM & SOFT SHADOWS                    */
/* ========================================================== */

/* Soft glassmorphism panels */
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

html.dark .glass-panel {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Elegant shadows */
.shadow-elegant {
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08);
}
html.dark .shadow-elegant {
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
}

/* Typography refinements */
h1, h2, h3, h4, h5, h6 {
  letter-spacing: -0.02em;
}

/* Button transitions */
button {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
button:active {
  transform: scale(0.98);
}
`;

css += modernCss;
fs.writeFileSync('src/index.css', css);
