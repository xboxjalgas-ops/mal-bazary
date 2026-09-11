const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');
test('market growth features are connected',()=>{const html=read('market.html'),app=read('js/app.js');assert.match(html,/id="filterRegion"/);assert.match(html,/id="priceStats"/);assert.match(app,/listing\.html\?id=/);assert.match(app,/shareListing/);assert.match(app,/reportListing/);});
test('individual listing page and PWA exist',()=>{assert.match(read('listing.html'),/id="listingDetail"/);assert.match(read('js/listing.js'),/WhatsApp/);assert.match(read('manifest.webmanifest'),/"display":"standalone"/);assert.match(read('service-worker.js'),/startsWith\('\/api\/'\)/);});
test('support accepts listing reports',()=>assert.match(read('api/support.js'),/'Шағым'/));
