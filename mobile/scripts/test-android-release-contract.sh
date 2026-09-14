#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
app_json="$root/mobile/app.json"
mobile_workflow="$root/.github/workflows/mobile.yml"
recovery_workflow="$root/.github/workflows/recover-android-build-9.yml"
one_shot_workflow="$root/.github/workflows/reklaio-android-one-shot.yml"
v10_recovery_workflow="$root/.github/workflows/reklaio-android-v10-recover.yml"
v10_verify_workflow="$root/.github/workflows/reklaio-android-v10-recover-verify.yml"

node - "$app_json" <<'NODE'
const fs = require('node:fs');
const app = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).expo;
if (app.icon !== './assets/icon.png') throw new Error('canonical app icon changed');
if (app.splash?.image !== app.icon) throw new Error('splash must use the canonical icon');
if (app.android?.adaptiveIcon !== undefined) throw new Error('adaptiveIcon must remain disabled');
NODE

grep -Fq "grep -Fq 'android:icon=\"@mipmap/ic_launcher\"'" "$mobile_workflow"
grep -Fq "if grep -Fq 'android:roundIcon='" "$mobile_workflow"
grep -Fq 'find android/app/src/main/res/mipmap-anydpi-v26 -type f' "$mobile_workflow"

grep -Fq 'BUILD_ID: 6a36bc3e-e1b2-45fa-9e40-c54d29e38d23' "$recovery_workflow"
grep -Fq "eas-version: 23.2.0" "$recovery_workflow"
grep -Fq 'eas build:view "$BUILD_ID" --json' "$recovery_workflow"
grep -Fq 'eas build:list --platform android --limit 50 --json --non-interactive' "$recovery_workflow"
grep -Fq 'eas build:download --build-id "$BUILD_ID" --json --non-interactive' "$recovery_workflow"
grep -Fq 'apkanalyzer manifest version-code "$AAB_PATH"' "$recovery_workflow"
grep -Fq 'name: Reklaio-0.4.3-v9-PlayStore' "$recovery_workflow"
grep -Fq '"track":"internal"' "$recovery_workflow"
grep -Fq '"status":"completed"' "$recovery_workflow"

if grep -Eq '(^|[[:space:]])eas build --platform android' "$recovery_workflow"; then
  echo 'Recovery workflow must never queue a new Android build.' >&2
  exit 1
fi

test "$(grep -Ec '^[[:space:]]*eas build --platform android --profile production --non-interactive --wait --json' "$one_shot_workflow")" -eq 1
! grep -Fq 'workflow_dispatch:' "$one_shot_workflow"
grep -Fq 'EXPECTED_SIGNING_SHA256: E4:AA:F0:0E:6D:97:D1:95:4F:DC:BC:C0:22:3F:71:4D:A3:7F:44:0F:2C:12:F0:AE:0F:72:D1:FC:5F:89:DA:5E' "$one_shot_workflow"
grep -Fq 'apkanalyzer manifest application-id "$AAB_PATH"' "$one_shot_workflow"
grep -Fq 'apkanalyzer manifest version-code "$AAB_PATH"' "$one_shot_workflow"
grep -Fq 'name: Reklaio-0.4.3-current-PlayStore' "$one_shot_workflow"
grep -Fq '"track":"internal"' "$one_shot_workflow"
grep -Fq '"status":"completed"' "$one_shot_workflow"
grep -Fq 'eas-build-id.txt' "$one_shot_workflow"
grep -Fq 'version-code.txt' "$one_shot_workflow"

grep -Fq 'BUILD_ID: 72b445cb-7542-45ce-bd97-84b46ddab3e8' "$v10_recovery_workflow"
grep -Fq 'VERSION_CODE: '\''10'\''' "$v10_recovery_workflow"
grep -Fq 'https://api.expo.dev/graphql' "$v10_recovery_workflow"
grep -Fq 'byId(buildId: $buildId)' "$v10_recovery_workflow"
grep -Fq 'Authorization: Bearer $EXPO_TOKEN' "$v10_recovery_workflow"
grep -Fq '.artifacts.buildUrl' "$v10_recovery_workflow"
grep -Fq 'test "$recovered_id" = "$BUILD_ID"' "$v10_recovery_workflow"
grep -Fq 'test "$recovered_status" = "FINISHED"' "$v10_recovery_workflow"
grep -Fq 'test "$recovered_code" = "$VERSION_CODE"' "$v10_recovery_workflow"
grep -Fq 'name: Reklaio-0.4.3-v10-PlayStore' "$v10_recovery_workflow"
grep -Fq 'bundletool.jar" validate --bundle="$AAB_PATH"' "$v10_recovery_workflow"
grep -Fq '"track":"internal"' "$v10_recovery_workflow"
grep -Fq '"status":"completed"' "$v10_recovery_workflow"
if grep -Eq '(^|[[:space:]])eas build --platform android' "$v10_recovery_workflow"; then
  echo 'v10 recovery must never queue another Android build.' >&2
  exit 1
fi

test -f "$v10_verify_workflow"
grep -Fq 'BUILD_ID: 72b445cb-7542-45ce-bd97-84b46ddab3e8' "$v10_verify_workflow"
grep -Fq 'VERSION_CODE: '\''10'\''' "$v10_verify_workflow"
grep -Fq 'PACKAGE_NAME: de.kamilunavo.reklaio' "$v10_verify_workflow"
grep -Fq 'EXPECTED_SIGNING_SHA256: E4:AA:F0:0E:6D:97:D1:95:4F:DC:BC:C0:22:3F:71:4D:A3:7F:44:0F:2C:12:F0:AE:0F:72:D1:FC:5F:89:DA:5E' "$v10_verify_workflow"
grep -Fq 'https://api.expo.dev/graphql' "$v10_verify_workflow"
grep -Fq 'bundletool.jar" validate --bundle="$AAB_PATH"' "$v10_verify_workflow"
grep -Fq 'name: Reklaio-0.4.3-v10-verified-aab' "$v10_verify_workflow"
if grep -Eq '(^|[[:space:]])eas build --platform android' "$v10_verify_workflow"; then
  echo 'Verify-only workflow must never queue a new Android build.' >&2
  exit 1
fi
if grep -Eq 'androidpublisher|/edits|tracks/internal|uploadType=media|google-github-actions/auth' "$v10_verify_workflow"; then
  echo 'Verify-only workflow must never authenticate to or write to Google Play.' >&2
  exit 1
fi

echo 'Reklaio Android release contract passed.'
