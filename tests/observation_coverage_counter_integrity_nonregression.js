'use strict';
const assert = require('assert');
const Guard = require('../first_results_runtime_guard_bridge_v1.js');
function check(attempted,usable,unavailable,expected){
  const state=Guard.observationState({bridge:{attemptedObservationFrames:attempted,usableObservationFrames:usable,unavailableObservationFrames:unavailable,observationQuality:'FIABLE'}});
  assert.strictEqual(state.quality,expected);
}
check(100,90,10,'FIABLE');
check(100,10,90,'PARTIEL');
check(100,90,20,'INDISPONIBLE');
check(0,0,0,'INDISPONIBLE');
console.log('observation coverage integrity: PASS');
