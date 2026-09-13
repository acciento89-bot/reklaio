#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
app_json="$root/mobile/app.json"
mobile_workflow="$root/.github/workflows/mobile.yml"
recovery_workflow="$root/.github/workflows/recover-android-build-9.yml"

node - "$app_json" <<'NODE'
const fs = require('node:fs');
const app = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).expo;
if (app.icon !== './assets/icon.png') throw new Error('canonical app icon changed');
if (app.splash?.image !== app.icon) throw new Error('splash must use the canonical icon');
if (app.android?.adaptiveIcon !== undefined) throw new Error('adaptiveIcon must remain disabled');
NODE

grep -Fq "grep -Fq 'android:icon=\"@mipmap/ic_launcher\"'" "$mobile_workflow"
grep -Fq "if grep -Fq 'android:roundIcon='" "$mobile_workflow"
grep -Fq "test ! -d android/app/src/main/res/mipmap-anydpi-v26" "$mobile_workflow"

grep -Fq 'BUILD_ID: 6a36bc3e-e1b2-45fa-9e40-c54d29e38d23' "$recovery_workflow"
grep -Fq "eas-version: 24.3.0" "$recovery_workflow"
grep -Fq 'eas build:view "$BUILD_ID" --json' "$recovery_workflow"
grep -Fq 'eas build:download --build-id "$BUILD_ID" --json --non-interactive' "$recovery_workflow"
grep -Fq 'apkanalyzer manifest version-code "$AAB_PATH"' "$recovery_workflow"
grep -Fq 'name: Reklaio-0.4.3-v9-PlayStore' "$recovery_workflow"
grep -Fq '"track":"internal"' "$recovery_workflow"
grep -Fq '"status":"completed"' "$recovery_workflow"

if grep -Eq '(^|[[:space:]])eas build --platform android' "$recovery_workflow"; then
  echo 'Recovery workflow must never queue a new Android build.' >&2
  exit 1
fi

echo 'Reklaio Android release contract passed.'
