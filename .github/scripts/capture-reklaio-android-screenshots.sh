#!/usr/bin/env bash
set -euo pipefail

readonly package_name="de.kamilunavo.reklaio"
readonly output_dir="$GITHUB_WORKSPACE/mobile/store/google-play/screenshots/de-DE"
readonly apk_path="$GITHUB_WORKSPACE/mobile/android/app/build/outputs/apk/release/app-release.apk"
readonly ready_text="SICHER ANMELDEN"

current_focus() {
  adb shell dumpsys window | grep "mCurrentFocus" | head -n 1 || true
}

hide_error_dialogs() {
  adb shell settings put global hide_error_dialogs 1 || true
  adb shell settings put global anr_show_background 0 || true
  adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1 || true
}

assert_no_system_dialog() {
  local focus
  focus="$(current_focus)"
  if [[ "$focus" != *"$package_name"* ]]; then
    echo "Unexpected foreground window; refusing to capture: $focus" >&2
    return 1
  fi
}

wait_for_foreground() {
  local attempt
  for attempt in $(seq 1 45); do
    if [[ "$(current_focus)" == *"$package_name"* ]]; then return 0; fi
    hide_error_dialogs
    sleep 1
  done
  echo 'Timed out waiting for Reklaio to become the foreground app.' >&2
  current_focus >&2
  return 1
}

wait_for_login_ui() {
  local attempt
  for attempt in $(seq 1 45); do
    if adb exec-out uiautomator dump /dev/tty 2>/dev/null | grep -Fq "$ready_text"; then return 0; fi
    assert_no_system_dialog
    sleep 1
  done
  echo "Timed out waiting for visible Reklaio login text: $ready_text" >&2
  adb exec-out uiautomator dump /dev/tty >&2 || true
  return 1
}


tap_by_text() {
  local label="$1"
  local coordinates
  local attempt
  for attempt in $(seq 1 30); do
    if coordinates="$(adb exec-out uiautomator dump /dev/tty 2>/dev/null | python3 -c 'import re,sys; label=sys.argv[1]; data=sys.stdin.read(); node=next((n for n in re.findall(r"<node [^>]+>", data) if f"text=\"{label}\"" in n), None); assert node, f"Visible text not found: {label}"; x1,y1,x2,y2=map(int,re.search(r"bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"",node).groups()); print((x1+x2)//2,(y1+y2)//2)' "$label")" && [[ -n "$coordinates" ]]; then
      read -r tap_x tap_y <<<"$coordinates"
      adb shell input tap "$tap_x" "$tap_y"
      return 0
    fi
    assert_no_system_dialog
    sleep 1
  done
  echo "Timed out waiting for visible tap target: $label" >&2
  adb exec-out uiautomator dump /dev/tty >&2 || true
  return 1
}

wait_for_keyboard() {
  local attempt
  for attempt in $(seq 1 30); do
    if adb shell dumpsys input_method | grep -Fq "mInputShown=true"; then return 0; fi
    assert_no_system_dialog
    sleep 1
  done
  echo "Timed out waiting for the focused email keyboard." >&2
  adb shell dumpsys input_method >&2 || true
  return 1
}

launch_app() {
  adb shell am force-stop "$package_name"
  hide_error_dialogs
  adb shell am start -W -n "$package_name/.MainActivity"
  wait_for_foreground
  wait_for_login_ui
  assert_no_system_dialog
}

mkdir -p "$output_dir"
rm -f "$output_dir"/*.png
adb install -r "$apk_path"
adb shell cmd uimode night no
launch_app
adb exec-out screencap -p > "$output_dir/01-sicher-anmelden.png"

adb shell settings put secure show_ime_with_hard_keyboard 1
tap_by_text "name@beispiel.de"
wait_for_keyboard
assert_no_system_dialog
adb exec-out screencap -p > "$output_dir/02-email-eingabe.png"

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

command -v compare >/dev/null
body_difference="$(compare -metric AE "$output_dir/01-sicher-anmelden.png[1080x2138+0+136]" "$output_dir/02-email-eingabe.png[1080x2138+0+136]" null: 2>&1 || true)"
python3 - "$body_difference" <<'PY'
import sys
assert float(sys.argv[1]) > 0, 'Screenshots must differ inside the app body'
PY
