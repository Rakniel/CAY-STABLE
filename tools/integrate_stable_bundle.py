from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent


def run(script_name):
    subprocess.check_call([sys.executable, str(ROOT / 'tools' / script_name)], cwd=ROOT)


def main():
    # Canonical shipped STABLE build order: tracking runtime first, then the
    # semantic calibration overlay. Keeping this in one entry point prevents
    # scheduled workflows from alternately rewriting the same HTML ordering.
    run('integrate_tracking_v2.py')
    run('integrate_calibration_v2.py')


if __name__ == '__main__':
    main()
