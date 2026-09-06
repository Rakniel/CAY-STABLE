'use strict';

const fs=require('fs');
const assert=require('assert');
const vm=require('vm');
const {execFileSync}=require('child_process');

// Validate the exact artifact users receive, not the stale pre-integration source.
execFileSync('python3',['tools/integrate_tracking_v2.py'],{stdio:'inherit'});
const html=fs.readFileSync('CAY_ANALYZER_STABLE.html','utf8');

// External <script src="…"> modules are already checked individually by the root
// syntax workflow. This guard covers inline application JavaScript embedded in the
// shipped HTML, which previously had no global syntax parse gate.
const scripts=[];
const re=/<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
while((match=re.exec(html))){
  const attrs=match[1]||'';
  if(/\bsrc\s*=/.test(attrs))continue;
  const source=match[2]||'';
  if(source.trim())scripts.push(source);
}

assert(scripts.length>0,'shipped STABLE HTML must contain inline application JavaScript');

for(let i=0;i<scripts.length;i++){
  assert.doesNotThrow(
    ()=>new vm.Script(scripts[i],{filename:`CAY_ANALYZER_STABLE.inline-${i+1}.js`}),
    `inline JavaScript block ${i+1} must parse successfully`
  );
}

console.log(`stable HTML inline JavaScript syntax: PASS (${scripts.length} inline block(s))`);
