const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const h=fs.readFileSync(require('path').join(__dirname,'../staff_tactics.html'),'utf8');
for(const x of ['id="pitchPng"','id="pitchSvg"','cay-logo-officiel.png','getPositions()','p.length>11','Number.isFinite(t.x)','canvas.toBlob','const esc=v=>','id="marks"'])assert(h.includes(x),x);
const s=h.match(/<script>\s*([\s\S]*?)<\/script>/g).pop().replace(/^<script>/,'').replace(/<\/script>$/,'');new vm.Script(s);
console.log('staff export integration: PASS');