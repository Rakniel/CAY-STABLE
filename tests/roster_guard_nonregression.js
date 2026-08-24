'use strict';
const assert=require('assert');
function priority(x){let p=(x.cat==='goalkeeper'?20:x.cat==='team'?10:0)+Number(x.score??0);const s=String(x.source||'');if(s.startsWith('posture_'))p-=.08;if(s==='far')p-=.05;return p;}
function guard(list,max=11){const players=list.filter(x=>x.cat==='team'||x.cat==='goalkeeper');if(players.length<=max)return list;const ranked=[...players].sort((a,b)=>priority(b)-priority(a));const keep=new Set(ranked.slice(0,max));return list.map(x=>(x.cat==='team'||x.cat==='goalkeeper')&&!keep.has(x)?{...x,originalCat:x.cat,cat:'review',rosterReason:'roster_overflow_plus_de_11'}:x);}
let a=Array.from({length:13},(_,i)=>({cat:'team',score:.95-i*.03,source:'yolo'}));let r=guard(a);assert.equal(r.filter(x=>x.cat==='team'||x.cat==='goalkeeper').length,11);assert.equal(r.filter(x=>x.cat==='review').length,2);
a=Array.from({length:12},(_,i)=>({cat:'team',score:.75-i*.01,source:'yolo'}));a.push({cat:'goalkeeper',score:.82,source:'yolo'});r=guard(a);assert.equal(r.filter(x=>x.cat==='goalkeeper').length,1);assert.equal(r.filter(x=>x.cat==='team').length,10);
a=Array.from({length:11},()=>({cat:'team',score:.8,source:'yolo'}));a.push({cat:'team',score:.55,source:'posture_torso'});r=guard(a);assert.equal(r.find(x=>x.source==='posture_torso').cat,'review');
a=Array.from({length:10},()=>({cat:'team',score:.7,source:'yolo'}));assert.equal(guard(a).length,a.length);assert.equal(guard(a).filter(x=>x.cat==='team').length,10);
console.log('8/8 roster non-regression: PASS');
