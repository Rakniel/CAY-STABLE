(function(root){
  'use strict';
  const Core=root.CAYTrackingCore,TwoStage=root.CAYTrackingTwoStageAdapter;
  if(!Core||typeof Core.assignFrame!=='function'||!TwoStage||typeof TwoStage.assignFrame!=='function')return;
  if(Core.__cayTwoStagePatched===true)return;
  Core.assignFrame=function(state,detections,time,options){
    return TwoStage.assignFrame(state,detections,time,options).assigned;
  };
  Core.__cayTwoStagePatched=true;
})(typeof globalThis!=='undefined'?globalThis:this);
