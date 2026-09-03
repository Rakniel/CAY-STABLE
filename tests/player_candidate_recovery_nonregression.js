'use strict';

const assert=require('assert');
const R=require('../player_candidate_recovery_v1.js');

const W=120,H=72,data=new Uint8ClampedArray(W*H*4);
function fill(r,g,b){for(let i=0;i<W*H;i++){data[i*4]=r;data[i*4+1]=g;data[i*4+2]=b;data[i*4+3]=255;}}
function rect(x,y,w,h,r,g,b){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){const i=(yy*W+xx)*4;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255;}}
fill(48,128,52);

// Two distant coloured footballers that a generic person detector may miss.
rect(34,27,5,16,236,205,28); // yellow
rect(78,30,5,15,185,38,35);  // red
// Bright white painted line: must not become a person candidate.
rect(5,55,105,2,235,235,235);
// Tiny yellow detail / sock: must not create a player.
rect(18,48,2,2,245,215,20);

const found=R.recoverFromImageData(data,W,H,[],{stride:1,minYRatio:.15,maxCandidates:6,dilatePasses:1,minGrassSupport:.18});
assert(found.length>=2,JSON.stringify(found));
assert(found.some(b=>b.x<45&&b.x+b.w>34&&b.y<35&&b.y+b.h>40),'yellow player should be recovered');
assert(found.some(b=>b.x<85&&b.x+b.w>78&&b.y<38&&b.y+b.h>43),'red player should be recovered');
assert(!found.some(b=>b.h<7),'tiny coloured detail must not become a player');
assert(found.every(b=>b.candidateOnly===true&&b.teamEvidence==='NONE'));

const existing=[{x:31,y:24,w:12,h:23,score:.8,source:'full'}];
const deduped=R.recoverFromImageData(data,W,H,existing,{stride:1,minYRatio:.15,maxCandidates:6,dilatePasses:1,minGrassSupport:.18});
assert(!deduped.some(b=>b.x<45&&b.x+b.w>34),'existing detector box must suppress duplicate yellow recovery');
assert(deduped.some(b=>b.x<90&&b.x+b.w>78),'other missed player should remain recoverable');

console.log('player candidate recovery non-regression: PASS');
