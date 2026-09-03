(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CAYPlayerCandidateRecovery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=v=>Number.isFinite(Number(v));

function iou(a,b){
  const ix=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
  const iy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
  const inter=ix*iy,union=a.w*a.h+b.w*b.h-inter;
  return union>0?inter/union:0;
}

function pixelStats(r,g,b){
  const max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min;
  const luma=.2126*r+.7152*g+.0722*b;
  const grass=g>44&&g>r*1.08&&g>b*1.05&&(g-Math.max(r,b))>8;
  const chromatic=chroma>24&&max>48;
  return {grass,chromatic,luma,chroma};
}

function dilate(mask,w,h,passes=1){
  let src=mask;
  for(let p=0;p<passes;p++){
    const out=new Uint8Array(src.length);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      let on=0;
      for(let yy=-1;yy<=1&&!on;yy++)for(let xx=-1;xx<=1;xx++)if(src[(y+yy)*w+x+xx]){on=1;break;}
      out[y*w+x]=on;
    }
    src=out;
  }
  return src;
}

function connectedComponents(mask,w,h){
  const seen=new Uint8Array(mask.length),out=[];
  const qx=[],qy=[];
  for(let sy=0;sy<h;sy++)for(let sx=0;sx<w;sx++){
    const si=sy*w+sx;
    if(!mask[si]||seen[si])continue;
    let head=0,minX=sx,maxX=sx,minY=sy,maxY=sy,count=0;
    qx.length=0;qy.length=0;qx.push(sx);qy.push(sy);seen[si]=1;
    while(head<qx.length){
      const x=qx[head],y=qy[head];head++;count++;
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy)continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=w||ny>=h)continue;
        const ni=ny*w+nx;
        if(mask[ni]&&!seen[ni]){seen[ni]=1;qx.push(nx);qy.push(ny);}
      }
    }
    out.push({minX,maxX,minY,maxY,count});
  }
  return out;
}

function grassSupport(grass,w,h,b,margin=2){
  const x1=Math.max(0,b.minX-margin),x2=Math.min(w-1,b.maxX+margin);
  const y1=Math.max(0,b.minY-margin),y2=Math.min(h-1,b.maxY+margin);
  let total=0,g=0;
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){
    if(x>=b.minX&&x<=b.maxX&&y>=b.minY&&y<=b.maxY)continue;
    total++;if(grass[y*w+x])g++;
  }
  return total?g/total:0;
}

function recoverFromImageData(imageData,width,height,existing=[],options={}){
  const data=imageData&&imageData.data?imageData.data:imageData;
  const W=Number(width),H=Number(height);
  if(!data||!Number.isInteger(W)||!Number.isInteger(H)||W<8||H<8||data.length<W*H*4)return [];
  const stride=Math.max(1,Math.min(4,Number(options.stride)||2));
  const sw=Math.ceil(W/stride),sh=Math.ceil(H/stride);
  const fg=new Uint8Array(sw*sh),grass=new Uint8Array(sw*sh);
  const minYRatio=finite(options.minYRatio)?clamp(Number(options.minYRatio),0,.8):.18;
  const minSY=Math.floor(sh*minYRatio);

  for(let sy=0;sy<sh;sy++)for(let sx=0;sx<sw;sx++){
    const x=Math.min(W-1,sx*stride),y=Math.min(H-1,sy*stride),i=(y*W+x)*4;
    const s=pixelStats(data[i],data[i+1],data[i+2]);
    const k=sy*sw+sx;
    if(s.grass)grass[k]=1;
    if(sy>=minSY&&!s.grass&&s.chromatic&&s.luma>28)fg[k]=1;
  }

  const grown=dilate(fg,sw,sh,Number.isInteger(options.dilatePasses)?options.dilatePasses:1);
  const comps=connectedComponents(grown,sw,sh),candidates=[];
  const minHR=finite(options.minHeightRatio)?Number(options.minHeightRatio):.024;
  const maxHR=finite(options.maxHeightRatio)?Number(options.maxHeightRatio):.24;
  const minAspect=finite(options.minAspect)?Number(options.minAspect):.12;
  const maxAspect=finite(options.maxAspect)?Number(options.maxAspect):1.05;
  const minGrass=finite(options.minGrassSupport)?Number(options.minGrassSupport):.22;

  for(const c of comps){
    const bw=(c.maxX-c.minX+1)*stride,bh=(c.maxY-c.minY+1)*stride;
    const hRatio=bh/H,aspect=bw/Math.max(1,bh),fill=c.count/Math.max(1,(c.maxX-c.minX+1)*(c.maxY-c.minY+1));
    if(hRatio<minHR||hRatio>maxHR||aspect<minAspect||aspect>maxAspect||fill<.16)continue;
    const support=grassSupport(grass,sw,sh,c,Math.max(2,Math.round((c.maxY-c.minY+1)*.35)));
    if(support<minGrass)continue;
    const padX=bw*.22,padTop=bh*.18,padBottom=bh*.08;
    const b={
      x:clamp(c.minX*stride-padX,0,W-1),
      y:clamp(c.minY*stride-padTop,0,H-1),
      w:Math.min(W, bw+padX*2),
      h:Math.min(H, bh+padTop+padBottom)
    };
    b.w=Math.min(b.w,W-b.x);b.h=Math.min(b.h,H-b.y);
    if(existing.some(e=>e&&iou(b,e)>.10))continue;
    const shapeScore=1-Math.min(1,Math.abs(aspect-.42)/.7);
    const score=clamp(.08+.07*support+.05*shapeScore+.03*Math.min(1,fill),.08,.22);
    candidates.push({...b,score,source:'appearance_candidate',candidateOnly:true,footballClass:'player',teamEvidence:'NONE'});
  }

  candidates.sort((a,b)=>b.score-a.score||b.h-a.h);
  const maxCandidates=Math.max(0,Math.min(12,Number(options.maxCandidates)||6));
  const kept=[];
  for(const c of candidates){
    if(kept.some(k=>iou(c,k)>.18))continue;
    kept.push(c);if(kept.length>=maxCandidates)break;
  }
  return kept;
}

function recoverFromCanvas(canvas,existing=[],options={}){
  if(!canvas||!(canvas.width>0&&canvas.height>0)||typeof canvas.getContext!=='function')return [];
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx||typeof ctx.getImageData!=='function')return [];
  const im=ctx.getImageData(0,0,canvas.width,canvas.height);
  return recoverFromImageData(im,canvas.width,canvas.height,existing,options);
}

return {
  VERSION:'1.0.0',
  POLICY:'RECOVER_GENERIC_PLAYER_CANDIDATES_NEVER_PROVE_CAY',
  pixelStats,
  recoverFromImageData,
  recoverFromCanvas,
  provenance:{
    designReference:'rafaelsouza-tech/soccer-tactical-vision team/color.py',
    license:'MIT',
    adaptedIdea:'use grass-aware appearance evidence only to support generic player candidates; team identity remains a separate stage',
    codeCopied:false
  }
};
});
