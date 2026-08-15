import fs from 'fs';
let css = fs.readFileSync('src/index.css', 'utf8');

css = css.replace("--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;", "--font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;");
css = css.replace("--font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;", "--font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;\n  --font-display: 'Playfair Display', serif;");

const addCustomFontClass = `
.font-display {
  font-family: var(--font-display);
}
`;

css += addCustomFontClass;
fs.writeFileSync('src/index.css', css);
