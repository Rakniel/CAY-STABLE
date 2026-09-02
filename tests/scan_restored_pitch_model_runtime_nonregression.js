'use strict';

const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const {execFileSync}=require('child_process');

// Reproduces the exact branch that crashed after the scan reached 100% when a
// previous CAY/stadium appearance model had been restored from local storage.
// Always test the exact STABLE artifact produced by the canonical integrator.
execFileSync('python3',['tools/integrate_tracking_v2.py'],{stdio:'inherit'});
const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

assert(
  html.includes('let medS=medianNumber(svals),medV=medianNumber(vvals);'),
  'pitch appearance medS/medV must be mutable because restored stadium learning blends them'
);
assert(
  !html.includes('const medS=medianNumber(svals),medV=medianNumber(vvals);'),
  'the old const declaration would crash the scan when restored pitch learning is present'
);

const start=html.indexOf('function pitchAppearanceModel(c){');
const end=html.indexOf('\nfunction pitchPixelScore(',start);
assert(start>=0&&end>start,'pitchAppearanceModel source must be present in shipped STABLE HTML');
const fnSource=html.slice(start,end);

function rgbToHsv(r,g,b){
  r/=255;g/=255;b/=255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=0;
  if(d){
    if(max===r)h=60*(((g-b)/d)%6);
    else if(max===g)h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
  }
  if(h<0)h+=360;
  return [h,max===0?0:d/max,max];
}
function medianNumber(a){
  if(!a.length)return 0;
  const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);
  return b.length%2?b[m]:(b[m-1]+b[m])*.5;
}
function circularHueDiff(a,b){
  const d=Math.abs(a-b)%360;
  return Math.min(d,360-d);
}

function makeCanvas(){
  const canvas={width:0,height:0};
  canvas.getContext=()=>({
    drawImage(){},
    getImageData(){
      const data=new Uint8ClampedArray(canvas.width*canvas.height*4);
      for(let i=0;i<data.length;i+=4){
        // Uniform realistic grass-like pixels: enough samples to enter the
        // restored-stadium blend path deterministically.
        data[i]=65;data[i+1]=125;data[i+2]=62;data[i+3]=255;
      }
      return {data};
    }
  });
  return canvas;
}

const context={
  console,Math,Uint8ClampedArray,
  document:{createElement:type=>{assert.strictEqual(type,'canvas');return makeCanvas();}},
  guidedStadiumModels:[{h:118,s:.48,v:.50}],
  rgbToHsv,medianNumber,circularHueDiff
};
vm.createContext(context);
vm.runInContext(fnSource,context);

let result;
assert.doesNotThrow(()=>{
  result=context.pitchAppearanceModel({width:640,height:360});
},'restored stadium learning must not throw Assignment to constant variable');
assert(result,'pitch appearance model should be produced for the deterministic grass frame');
assert(Number.isFinite(result.s)&&Number.isFinite(result.v),'blended saturation/value must remain numeric');
assert(result.seedCount>=50,'fixture must exercise the real appearance-model branch');

console.log('scan restored pitch model runtime non-regression: PASS');
