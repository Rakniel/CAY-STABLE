'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');

const source=fs.readFileSync(path.join(__dirname,'..','stable_runtime_tracking_v2.js'),'utf8');

assert.match(source,/const renderer=root\.CAYPlayerCardRenderer,model=report\.playerCards;/,'STABLE runtime must consume the canonical player-card model');
assert.match(source,/renderer&&typeof renderer\.render==='function'/,'STABLE runtime must delegate rendering to CAYPlayerCardRenderer');
assert.match(source,/renderer\.render\(model,cards\)/,'STABLE runtime must render canonical cards into the existing target');
assert.match(source,/Aucune statistique parallèle n’est affichée/,'missing canonical contracts must fail closed rather than render parallel metrics');
assert.match(source,/FICHES JOUEURS — ANALYSE C\.A\. YENNE/,'player-card panel must use C.A. Yenne terminology');
assert.match(source,/rgba\(205,31,45,/,'player-card panel must retain the red\/black CAY visual language');

assert.doesNotMatch(source,/function qualityBadge\(/,'legacy duplicate player-card badge renderer must stay removed');
assert.doesNotMatch(source,/function heatmapHtml\(/,'legacy duplicate heatmap renderer must stay removed');
assert.doesNotMatch(source,/cards\.innerHTML=players\.map/,'runtime must not rebuild player cards independently');
assert.doesNotMatch(source,/rgba\(99,216,137,/,'legacy green heatmap must not overwrite canonical CAY red heatmaps');

console.log('stable canonical player-card runtime non-regression: ok');
