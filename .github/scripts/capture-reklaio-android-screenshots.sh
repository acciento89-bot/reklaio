#!/usr/bin/env bash
set -euo pipefail

readonly package_name="de.kamilunavo.reklaio"
readonly output_dir="$GITHUB_WORKSPACE/mobile/store/google-play/screenshots/de-DE"
readonly apk_path="$GITHUB_WORKSPACE/mobile/android/app/build/outputs/apk/debug/app-debug.apk"

wait_for_foreground() {
  local attempt
  for attempt in $(seq 1 30); do
    if adb shell dumpsys window windows |
      grep -E "mCurrentFocus|mFocusedApp" |
      grep -Fq "$package_name"; then
      return 0
    fi
    sleep 1
  done
  echo 'Timed out waiting for Reklaio to become the foreground app.' >&2
  adb shell dumpsys window windows |
    grep -E "mCurrentFocus|mFocusedApp" >&2 || true
  return 1
}

assert_clean_foreground() {
  if ! adb shell dumpsys window windows | grep -E "mCurrentFocus|mFocusedApp" | grep -Fq "$package_name"; then
    echo 'Reklaio is not the foreground app; refusing to capture.' >&2
    adb shell dumpsys window windows |
      grep -E "mCurrentFocus|mFocusedApp" >&2 || true
    return 1
  fi
}

mkdir -p "$output_dir"
rm -f "$output_dir"/*.png
adb install -r "$apk_path"
adb shell am force-stop "$package_name"
adb shell am start -n "$package_name/.MainActivity"

wait_for_foreground
sleep 8
assert_clean_foreground
adb exec-out screencap -p > "$output_dir/01-sicher-anmelden.png"

adb shell cmd uimode night yes
adb shell am force-stop "$package_name"
adb shell am start -n "$package_name/.MainActivity"
wait_for_foreground
sleep 8
assert_clean_foreground
adb exec-out screencap -p > "$output_dir/02-sicher-anmelden-dunkel.png"

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
