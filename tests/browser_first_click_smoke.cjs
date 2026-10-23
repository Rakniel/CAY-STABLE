'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

// Exercise real mouse events, video upload and error recovery with model CDNs offline.
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.wasm':'application/wasm','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
 const file=path.resolve(root,'.'+pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{
  if(err){res.writeHead(404).end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
  res.end(bytes);
 });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 let checks=0;
 try{
  for(const html of ['index.html','CAY_ANALYZER_STABLE.html']){
   const page=await browser.newPage();
   const exceptions=[];
   page.on('pageerror',error=>exceptions.push(error.stack||error.message));
   await page.route(/https:\/\/(cdn\.jsdelivr\.net|unpkg\.com)\//,route=>route.abort());
   await page.goto('http://127.0.0.1:'+server.address().port+'/'+html,{waitUntil:'domcontentloaded',timeout:20000});
   await page.waitForFunction(()=>document.querySelector('#splash')?.classList.contains('hide'),null,{timeout:4000});
   assert.equal(await page.locator('#scanBtn').isDisabled(),true,html+': scan must be disabled without video');checks++;
   assert.equal(await page.locator('#fileInput').count(),1,html+': missing upload control');checks++;
   await page.locator('#fileInput').setInputFiles({name:'invalid-video.mp4',mimeType:'video/mp4',buffer:Buffer.from('invalid video bytes')});
   await page.waitForFunction(()=>document.querySelector('#scanStatus')?.textContent.includes('Vidéo illisible'),null,{timeout:8000});
   assert.equal(await page.locator('#scanBtn').isDisabled(),true,html+': scan enabled for invalid video');checks++;
   assert.match(await page.locator('#fileLabel').innerText(),/invalid-video\.mp4/,html+': upload did not update label');checks++;
   await page.locator('.infohelp').first().click({timeout:5000});
   assert.equal(await page.locator('.infohelp').first().evaluate(el=>el.classList.contains('open')),true,html+': real mouse click failed');checks++;
   assert.deepEqual(exceptions,[],html+': uncaught JavaScript exceptions');checks++;
   console.log(html+': first-click smoke PASS (6 checks, model CDNs blocked)');
   await page.close();
  }
  console.log(checks+'/'+checks+' browser smoke assertions PASS');
 }finally{await browser.close();}
})().catch(err=>{console.error(err.stack||err);process.exitCode=1;}).finally(()=>server.close());
