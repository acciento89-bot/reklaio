#!/usr/bin/env bash
set -euo pipefail

readonly package_name="de.kamilunavo.reklaio"
readonly output_dir="$GITHUB_WORKSPACE/mobile/store/google-play/screenshots/de-DE"
readonly apk_path="$GITHUB_WORKSPACE/mobile/android/app/build/outputs/apk/debug/app-debug.apk"

dump_ui() {
  adb shell uiautomator dump /sdcard/window.xml >/dev/null 2>&1 || true
  adb shell cat /sdcard/window.xml 2>/dev/null
}

wait_for_text() {
  local expected="$1"
  local attempt
  for attempt in $(seq 1 45); do
    if dump_ui | grep -Fq "$expected"; then
      return 0
    fi
    sleep 1
  done
  echo "Timed out waiting for real Reklaio UI: $expected" >&2
  dump_ui >&2 || true
  return 1
}

tap_text() {
  local expected="$1"
  dump_ui > /tmp/reklaio-window.xml
  python3 - "$expected" <<'PY'
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

expected = sys.argv[1]
root = ET.parse('/tmp/reklaio-window.xml').getroot()
for node in root.iter('node'):
    if expected not in (node.attrib.get('text', ''), node.attrib.get('content-desc', '')):
        continue
    bounds = [int(value) for value in re.findall(r'\d+', node.attrib.get('bounds', ''))]
    if len(bounds) != 4:
        continue
    x = (bounds[0] + bounds[2]) // 2
    y = (bounds[1] + bounds[3]) // 2
    subprocess.run(['adb', 'shell', 'input', 'tap', str(x), str(y)], check=True)
    break
else:
    raise SystemExit(f'Could not find tappable text: {expected}')
PY
}

assert_clean_foreground() {
  if ! adb shell dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp" | grep -Fq "$package_name"; then
    echo 'Reklaio is not the foreground app; refusing to capture.' >&2
    return 1
  fi
  if dump_ui | grep -Eqi "isn't responding|responding|reagiert nicht|keine rückmeldung|keeps stopping|wird wiederholt beendet"; then
    echo 'A system error dialog is covering Reklaio; refusing to capture.' >&2
    return 1
  fi
}

mkdir -p "$output_dir"
rm -f "$output_dir"/*.png
adb install -r "$apk_path"
adb shell am force-stop "$package_name"
adb shell am start -n "$package_name/.MainActivity"

wait_for_text 'Deine Fallakte unterwegs'
assert_clean_foreground
adb exec-out screencap -p > "$output_dir/01-sicher-anmelden.png"

tap_text 'Anmelden'
wait_for_text 'Bitte E-Mail-Adresse und Passwort eingeben.'
assert_clean_foreground
adb exec-out screencap -p > "$output_dir/02-eingaben-validieren.png"

python3 - "$output_dir" <<'PY'
import hashlib
import struct
import sys
from pathlib import Path

paths = sorted(Path(sys.argv[1]).glob('*.png'))
assert len(paths) == 2, paths
digests = set()
for path in paths:
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', path
    width, height = struct.unpack('>II', data[16:24])
    assert (width, height) == (1080, 2400), (path, width, height)
    digests.add(hashlib.sha256(data).hexdigest())
assert len(digests) == 2, 'Screenshots must show distinct real states'
PY
