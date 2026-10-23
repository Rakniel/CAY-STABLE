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


// The public entrypoint is index.html, not just the canonical integration file.
// A syntactically valid inline bundle is unusable when a deployment silently
// omits the sibling scripts referenced by its HTML. Verify both entrypoints.
for(const [label,entryHtml] of [
  ['index.html',fs.readFileSync('index.html','utf8')],
  ['CAY_ANALYZER_STABLE.html',html]
]){
  const sources=[...entryHtml.matchAll(/<script\b[^>]*\bsrc=["']\.\/([^"']+\.js)["'][^>]*><\/script>/gi)]
    .map(match=>match[1]);
  assert(sources.length>=20,label+' must load its tracking/calibration runtime modules');
  assert.strictEqual(new Set(sources).size,sources.length,label+' must not duplicate runtime modules');
  for(const source of sources){
    assert(fs.existsSync(source),label+' references a missing script: '+source);
  }

  const inline=[...entryHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match=>!/\bsrc\s*=/.test(match[1]||''))
    .map(match=>match[2]).filter(source=>source.trim());
  for(let i=0;i<inline.length;i++){
    assert.doesNotThrow(
      ()=>new vm.Script(inline[i],{filename:label+'.inline-'+(i+1)+'.js'}),
      label+' inline JavaScript block '+(i+1)+' must parse'
    );
  }

  // These are the user's actual first actions. A missing handler means a
  // visible control can do nothing even when all modules pass syntax checks.
  for(const id of ['scanBtn','analyzeBtn','runTracking']){
    assert(entryHtml.includes('id="'+id+'"'),label+' missing action button '+id);
    assert(entryHtml.includes("$('"+id+"').onclick="),
      label+' missing click handler for '+id);
  }
  assert(entryHtml.includes('id="fileInput"'),label+' missing video upload control');
  console.log(label+' entrypoint smoke: PASS ('+sources.length+' local scripts, '+inline.length+' inline blocks)');
}

console.log(`stable HTML inline JavaScript syntax: PASS (${scripts.length} inline block(s))`);
