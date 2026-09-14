#!/usr/bin/env python3
"""Check generated Android launch resources, not just Expo configuration fields."""

import sys
from pathlib import Path
import xml.etree.ElementTree as ET

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[1]
ANDROID = "{http://schemas.android.com/apk/res/android}"
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
BACKGROUND = "#070d25"
IMAGE_WIDTH = 192


def check(native_root=ROOT / "android"):
    main = native_root / "app/src/main"
    res = main / "res"
    canonical = Image.open(ROOT / "assets/icon.png").convert("RGBA")
    expected_paths = set()
    for density, scale in DENSITIES.items():
        path = res / f"drawable-{density}/splashscreen_logo.png"
        expected_paths.add(path)
        assert path.is_file(), f"Missing generated splash: {path}"
        actual = Image.open(path).convert("RGBA")
        canvas = round(288 * scale)
        width = round(IMAGE_WIDTH * scale)
        assert actual.size == (canvas, canvas), f"Unexpected splash dimensions: {path}"
        expected = Image.new("RGBA", (canvas, canvas))
        logo = canonical.resize((width, width), Image.Resampling.LANCZOS)
        expected.alpha_composite(logo, ((canvas - width) // 2, (canvas - width) // 2))
        # Compare visible pixels on both backgrounds to catch wrong artwork and alpha.
        # Small tolerance accommodates independent Expo/Pillow resampling differences.
        for color in ("black", "white"):
            backdrop = Image.new("RGBA", actual.size, color)
            observed = Image.alpha_composite(backdrop, actual).convert("RGB")
            wanted = Image.alpha_composite(backdrop, expected).convert("RGB")
            error = max(ImageStat.Stat(ImageChops.difference(observed, wanted)).mean)
            assert error < 2.0, f"Noncanonical splash pixels: {path} ({color}, error={error:.3f})"
    actual_paths = set(res.glob("drawable*/splashscreen_logo.*"))
    assert actual_paths == expected_paths, f"Unexpected splash override: {actual_paths - expected_paths}"

    manifest = ET.parse(main / "AndroidManifest.xml").getroot()
    application = manifest.find("application")
    assert application is not None
    assert application.get(ANDROID + "icon") == "@mipmap/ic_launcher"
    assert application.get(ANDROID + "roundIcon") is None, "Divergent round launcher icon"
    activities = [a for a in application.findall("activity") if a.get(ANDROID + "name", "").endswith("MainActivity")]
    assert len(activities) == 1
    assert activities[0].get(ANDROID + "theme") == "@style/Theme.App.SplashScreen"

    themes = []
    backgrounds = []
    for path in res.glob("values*/*.xml"):
        resources = ET.parse(path).getroot()
        for style in resources.findall("style"):
            if style.get("name") == "Theme.App.SplashScreen":
                themes.append(path)
                items = {i.get("name"): i.text for i in style.findall("item")}
                assert items.get("windowSplashScreenAnimatedIcon") == "@drawable/splashscreen_logo", f"Wrong active splash reference: {path}"
                assert items.get("windowSplashScreenBackground") == "@color/splashscreen_background", f"Wrong splash background reference: {path}"
                assert items.get("postSplashScreenTheme") == "@style/AppTheme", f"Wrong post-splash theme: {path}"
        for color in resources.findall("color"):
            if color.get("name") == "splashscreen_background":
                backgrounds.append(path)
                assert (color.text or "").lower() == BACKGROUND, f"Wrong splash background: {path}"
    assert themes and backgrounds, "Generated splash theme or background is missing"
    print("Reklaio Android launch theme and all five splash densities use canonical artwork.")


if __name__ == "__main__":
    check(Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "android")
