import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

const headFonts = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet">
`;

html = html.replace('<title>Asset Intelligence</title>', '<title>Asset Intelligence</title>' + headFonts);
fs.writeFileSync('index.html', html);
