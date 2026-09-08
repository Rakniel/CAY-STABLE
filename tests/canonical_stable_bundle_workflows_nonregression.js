const fs = require('fs');
const assert = require('assert');

const workflows = [
  '.github/workflows/cay-stable-integration.yml',
  '.github/workflows/cay-calibration-v2.yml',
];

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

console.log('canonical STABLE workflow entrypoint non-regression: PASS');
