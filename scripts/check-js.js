const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Script } = require('node:vm');

const root = path.resolve(__dirname, '..');
function javascriptFiles(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? javascriptFiles(relative) : entry.name.endsWith('.js') ? [relative] : [];
  });
}

const files = ['service-worker.js', ...['js', 'api', 'lib', 'netlify/functions', 'scripts', 'test'].flatMap(javascriptFiles)];
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    failed = true;
    console.error(`${file}: ${result.error?.message || result.stderr || result.stdout}`);
  }
}

let inlineCount = 0;
for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (/\bsrc\s*=/i.test(match[1])) continue;
    const type = /\btype\s*=\s*["']([^"']+)["']/i.exec(match[1])?.[1];
    try {
      if (type === 'application/ld+json') JSON.parse(match[2]);
      else new Script(match[2], { filename: file });
      inlineCount++;
    } catch (error) {
      failed = true;
      console.error(`${file}: ${error.message}`);
    }
  }
}
console.log(`Checked ${files.length} JavaScript files and ${inlineCount} inline scripts / JSON-LD blocks.`);
process.exitCode = failed ? 1 : 0;
