'use strict';
const fs=require('fs');
const assert=require('assert');

const integrator=fs.readFileSync('tools/integrate_tracking_v2.py','utf8');
const gateTag='<script src="./first_results_testability_gate_v1.js"></script>';
const viewModelTag='<script src="./player_card_view_model_v1.js"></script>';
const rendererTag='<script src="./player_card_renderer_v1.js"></script>';

assert.strictEqual((integrator.match(new RegExp(gateTag.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,'canonical STABLE integrator must ship the first-results testability gate exactly once');
assert(integrator.indexOf(viewModelTag)<integrator.indexOf(gateTag),'testability gate must load after the player-card view model it evaluates');
assert(integrator.indexOf(gateTag)<integrator.indexOf(rendererTag),'testability gate must be available before player-card rendering/runtime consumers');

const gate=require('../first_results_testability_gate_v1.js');
assert.strictEqual(typeof gate.evaluate,'function','shipped gate must expose evaluate()');

console.log('first results testability canonical bundle non-regression: PASS');
