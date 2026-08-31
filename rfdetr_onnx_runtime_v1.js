(function(root){
'use strict';

const MEAN=[0.485,0.456,0.406],STD=[0.229,0.224,0.225];
const Adapter=root.CAYRFDETRONNXAdapter||(typeof require==='function'?require('./rfdetr_onnx_adapter_v1.js'):null);
const Registry=root.CAYDetectorCandidateRegistry||(typeof require==='function'?require('./detector_candidate_registry_v1.js'):null);

function fixedDim(v){const n=Number(v);return Number.isInteger(n)&&n>0?n:null;}
function inputShape(session){
  const meta=session?.inputMetadata?.[0];
  const shape=meta?.shape||meta?.dimensions||meta?.dims;
  if(!Array.isArray(shape)||shape.length!==4)throw new Error('RFDETR_INPUT_SHAPE_REQUIRED');
  const batch=fixedDim(shape[0]),channels=fixedDim(shape[1]),height=fixedDim(shape[2]),width=fixedDim(shape[3]);
  if(batch!==1||!(channels===1||channels===3)||!height||!width)throw new Error('RFDETR_INPUT_SHAPE_UNSUPPORTED');
  return {batch,channels,height,width,inputName:session.inputNames?.[0]||meta?.name||'images'};
}
function looksLikeRFDETR(session){
  const names=(session?.outputNames||[]).map(x=>String(x).toLowerCase());
  const named=(names.some(x=>x.includes('dets')||x.includes('pred_boxes'))&&names.some(x=>x.includes('labels')||x.includes('pred_logits')));
  if(named)return true;
  const metas=session?.outputMetadata||[];
  let boxes=0,logits=0;
  for(const m of metas){const s=m?.shape||m?.dimensions||m?.dims;if(!Array.isArray(s)||s.length!==3)continue;if(Number(s[2])===4)boxes++;else if(fixedDim(s[2]))logits++;}
  return boxes===1&&logits===1;
}
function preprocessPixels(src,srcW,srcH,dstW,dstH,channels=3){
  if(!(src&&src.length>=srcW*srcH*4)||![srcW,srcH,dstW,dstH].every(v=>Number.isInteger(v)&&v>0))throw new Error('RFDETR_IMAGE_DATA_INVALID');
  if(channels!==3&&channels!==1)throw new Error('RFDETR_CHANNELS_UNSUPPORTED');
  const plane=dstW*dstH,out=new Float32Array(plane*channels);
  for(let oy=0;oy<dstH;oy++){
    const sy=(oy+.5)*srcH/dstH-.5,fy=Math.floor(sy),wy=sy-fy;
    const y0=Math.max(0,Math.min(srcH-1,fy)),y1=Math.max(0,Math.min(srcH-1,fy+1));
    for(let ox=0;ox<dstW;ox++){
      const sx=(ox+.5)*srcW/dstW-.5,fx=Math.floor(sx),wx=sx-fx;
      const x0=Math.max(0,Math.min(srcW-1,fx)),x1=Math.max(0,Math.min(srcW-1,fx+1));
      const i00=(y0*srcW+x0)*4,i01=(y0*srcW+x1)*4,i10=(y1*srcW+x0)*4,i11=(y1*srcW+x1)*4;
      const p=oy*dstW+ox;
      if(channels===1){
        const v00=(src[i00]+src[i00+1]+src[i00+2])/3,v01=(src[i01]+src[i01+1]+src[i01+2])/3,v10=(src[i10]+src[i10+1]+src[i10+2])/3,v11=(src[i11]+src[i11+1]+src[i11+2])/3;
        const top=v00+(v01-v00)*wx,bot=v10+(v11-v10)*wx,v=(top+(bot-top)*wy)/255;
        out[p]=(v-MEAN[0])/STD[0];
        continue;
      }
      for(let c=0;c<3;c++){
        const top=src[i00+c]+(src[i01+c]-src[i00+c])*wx;
        const bot=src[i10+c]+(src[i11+c]-src[i10+c])*wx;
        const v=(top+(bot-top)*wy)/255;
        out[c*plane+p]=(v-MEAN[c])/STD[c];
      }
    }
  }
  return out;
}
function preprocessCanvas(canvas,height,width,channels=3){
  if(!canvas||!(canvas.width>0&&canvas.height>0)||typeof canvas.getContext!=='function')throw new Error('RFDETR_CANVAS_REQUIRED');
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx||typeof ctx.getImageData!=='function')throw new Error('RFDETR_CANVAS_CONTEXT_REQUIRED');
  const im=ctx.getImageData(0,0,canvas.width,canvas.height);
  return preprocessPixels(im.data,canvas.width,canvas.height,width,height,channels);
}
function validateProfile(candidateId,profile){
  const c=Registry?.get?.(candidateId);
  if(!c||c.family!=='rfdetr')throw new Error('RFDETR_CANDIDATE_PROFILE_REQUIRED');
  const ids=profile?.personClassIds;
  if(!Array.isArray(ids)||!ids.length||ids.some(v=>!Number.isInteger(Number(v))||Number(v)<0))throw new Error('RFDETR_PERSON_CLASS_PROFILE_REQUIRED');
  return {...profile,personClassIds:[...new Set(ids.map(Number))]};
}
function createDetector(session,options={}){
  if(!Adapter||typeof Adapter.decode!=='function')throw new Error('RFDETR_ADAPTER_REQUIRED');
  if(!Registry||typeof Registry.promotionVerdict!=='function')throw new Error('RFDETR_REGISTRY_REQUIRED');
  if(!session||typeof session.run!=='function')throw new Error('RFDETR_SESSION_REQUIRED');
  if(!looksLikeRFDETR(session))throw new Error('RFDETR_SESSION_CONTRACT_UNSUPPORTED');
  const candidateId=String(options.candidateId||''),profile=validateProfile(candidateId,options.profile||{});
  const mode=options.mode==='runtime'?'runtime':'benchmark';
  if(mode==='runtime')Registry.assertPromotable(candidateId,options.benchmarkReport,options.provenance);
  const shape=inputShape(session),TensorCtor=options.Tensor||root.ort?.Tensor;
  if(typeof TensorCtor!=='function')throw new Error('RFDETR_TENSOR_CONSTRUCTOR_REQUIRED');
  return {
    kind:mode==='runtime'?'football-rfdetr':'football-rfdetr-benchmark',
    name:'RF-DETR ONNX '+(mode==='runtime'?'STABLE':'BENCHMARK'),candidateId,profile,session,inputShape:shape,
    async detect(canvas,maxBoxes=120,minScore=.30){
      const data=preprocessCanvas(canvas,shape.height,shape.width,shape.channels);
      const tensor=new TensorCtor('float32',data,[1,shape.channels,shape.height,shape.width]);
      const results=await session.run({[shape.inputName]:tensor});
      return Adapter.decode(results,{width:canvas.width,height:canvas.height,threshold:minScore,maxBoxes,personClassIds:profile.personClassIds,backgroundClassId:profile.backgroundClassId});
    }
  };
}

root.CAYRFDETRONNXRuntime={inputShape,looksLikeRFDETR,preprocessPixels,preprocessCanvas,validateProfile,createDetector,mean:[...MEAN],std:[...STD],upstreamPreprocess:'bilinear-half-pixel-antialias-false+imagenet'};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CAYRFDETRONNXRuntime;
})(typeof globalThis!=='undefined'?globalThis:this);
