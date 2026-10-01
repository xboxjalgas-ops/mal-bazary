/* Only browser assets enter the public output. SQL, tests and server code stay out. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist-public');
fs.mkdirSync(output, { recursive: true });
const files = ['index.html','market.html','listing.html','admin.html','favicon.svg','manifest.webmanifest','robots.txt','sitemap.xml','service-worker.js','googlef551e92e10ba780f.html'];
for (const file of files) fs.copyFileSync(path.join(root,file), path.join(output,file));
for (const dir of ['css','js','assets']) fs.cpSync(path.join(root,dir),path.join(output,dir),{recursive:true});
console.log('Public assets prepared in dist-public; server code and database migrations are excluded.');
