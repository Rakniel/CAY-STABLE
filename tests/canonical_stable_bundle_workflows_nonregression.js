const fs = require('fs');
const assert = require('assert');

const stablePath = '.github/workflows/cay-stable-integration.yml';
const calibrationPath = '.github/workflows/cay-calibration-v2.yml';
const workflows = [stablePath, calibrationPath];

for (const path of workflows) {
  const source = fs.readFileSync(path, 'utf8');
  assert(
    source.includes('python3 tools/integrate_stable_bundle.py'),
    `${path} must build shipped HTML through integrate_stable_bundle.py`,
  );

  const directIntegratorCommand = /^\s*(?:run:\s*)?python3 tools\/integrate_(?:tracking_v2|calibration_v2)\.py\s*$/m;
  assert(
    !directIntegratorCommand.test(source),
    `${path} must not invoke tracking/calibration integrators directly`,
  );
}

const stable = fs.readFileSync(stablePath, 'utf8');
const calibration = fs.readFileSync(calibrationPath, 'utf8');

assert(stable.includes('contents: write'), 'STABLE delivery workflow must retain contents: write');
assert(stable.includes('git reset --hard origin/main'), 'STABLE writer must rebuild from latest main before delivery');
assert(stable.includes('git push origin HEAD:main'), 'STABLE workflow must be the shipped HTML writer');
assert(!stable.includes('git pull --rebase origin main'), 'STABLE writer must never rebase a stale generated HTML diff');

assert(calibration.includes('contents: read'), 'calibration workflow must be validation-only');
assert(!calibration.includes('git push origin HEAD:main'), 'calibration workflow must never write shipped HTML');
assert(!calibration.includes("git commit -m 'feat(stable): enable canonical stable bundle'"), 'calibration workflow must never commit shipped HTML');

const writers = workflows.filter(path => fs.readFileSync(path, 'utf8').includes('git push origin HEAD:main'));
assert.deepStrictEqual(writers, [stablePath], 'exactly one workflow must write shipped STABLE HTML');

console.log('canonical STABLE workflow single-writer non-regression: PASS');
