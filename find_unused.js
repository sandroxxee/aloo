import fs from 'fs';
import path from 'path';

function getAllFiles(dir, extn, files, result, regex) {
  files = files || fs.readdirSync(dir);
  result = result || [];

  for (let i = 0; i < files.length; i++) {
    let file = path.join(dir, files[i]);
    if (fs.statSync(file).isDirectory()) {
      getAllFiles(file, extn, fs.readdirSync(file), result, regex);
    } else {
      if (file.endsWith(extn) && !file.includes('node_modules')) {
        result.push(file);
      }
    }
  }
  return result;
}

const allTs = getAllFiles('./src', '.ts');
const allTsx = getAllFiles('./src', '.tsx');
const allFiles = [...allTs, ...allTsx];

const unusedFiles = [];

for (const file of allFiles) {
  if (file === 'src/main.tsx' || file === 'src/App.tsx' || file === 'src/vite-env.d.ts') continue;
  
  const baseName = path.basename(file, path.extname(file));
  let isUsed = false;
  
  for (const otherFile of allFiles) {
    if (file === otherFile) continue;
    const content = fs.readFileSync(otherFile, 'utf-8');
    if (content.includes(baseName)) {
      isUsed = true;
      break;
    }
  }
  if (file === 'server.ts') isUsed = true;
  
  if (!isUsed) {
    // Also check server.ts
    if (fs.existsSync('./server.ts')) {
        const serverContent = fs.readFileSync('./server.ts', 'utf-8');
        if (serverContent.includes(baseName)) {
            isUsed = true;
        }
    }
  }

  if (!isUsed) {
    unusedFiles.push(file);
  }
}

console.log("Arquivos possivelmente não utilizados:");
unusedFiles.forEach(f => console.log(f));
