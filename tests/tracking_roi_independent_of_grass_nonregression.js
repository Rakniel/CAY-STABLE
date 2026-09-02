'use strict';

const fs=require('fs');
const assert=require('assert');
const {execFileSync}=require('child_process');

execFileSync('python3',['tools/integrate_tracking_v2.py'],{stdio:'inherit'});
const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

const start=html.indexOf('function trackingPoly(t,c){');
assert(start>=0,'trackingPoly must exist');
const block=html.slice(start,start+650);

assert(
  block.includes('if(s&&s.manual&&s.manual.length>=3)return s.manual;'),
  'an explicit manual field polygon must remain supported'
);
assert(
  block.includes('Tracking image-space : ne jamais exclure des joueurs à cause du masque gazon.'),
  'tracking must explicitly use image-space fallback when no manual polygon exists'
);
assert(
  block.includes('return [{x:0,y:0},{x:w-1,y:0},{x:w-1,y:h-1},{x:0,y:h-1}];'),
  'tracking fallback must cover the full image instead of trusting grass segmentation'
);
assert(
  !block.includes('autoField(c)'),
  'trackingPoly must not call autoField'
);
assert(
  !block.includes('s&&s.auto?s.auto:null'),
  'trackingPoly must not fall back to the stored grass mask'
);

console.log('tracking ROI independent of grass non-regression: PASS');
