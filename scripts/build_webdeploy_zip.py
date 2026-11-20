#!/usr/bin/env python3
"""Build webdeploy.zip for InMotion Hosting (cPanel File Manager).

Extracts cleanly to public_html/test/ on portacoco.com without overwriting
or interfering with the live production site at portacoco.com/airdrive.html.

Usage:
    python3 scripts/build_webdeploy_zip.py
"""

from __future__ import annotations

import os
import shutil
import sys
import zipfile
from pathlib import Path


def main() -> int:
    base_dir = Path(__file__).resolve().parents[1]
    # Check if in web repo or firmware repo
    if (base_dir / "airdrive.html").is_file():
        web_dir = base_dir
        fw_dir = base_dir.parent / "MODEL_T_AirDrive"
        if not fw_dir.exists():
            # Check worktrees
            fw_dir = Path("/Users/macbook/.gemini/antigravity/worktrees/MODEL_T_AirDrive/web_bbs_internet_bridge")
    else:
        fw_dir = base_dir
        web_dir = base_dir.parent / "MODEL_T_AirDrive_Web"
        if not web_dir.exists():
            web_dir = Path("/Users/macbook/.gemini/antigravity/worktrees/MODEL_T_AirDrive_Web/web_bbs_internet_bridge")

    print(f"Web source directory: {web_dir}")

    # 1. Update airdrive_firmware.uf2 from dist/AirDrive-factory.uf2 if available
    factory_uf2 = fw_dir / "dist" / "AirDrive-factory.uf2"
    target_uf2 = web_dir / "airdrive_firmware.uf2"
    if factory_uf2.is_file():
        target_uf2.write_bytes(factory_uf2.read_bytes())
        print(f"Updated airdrive_firmware.uf2 from {factory_uf2} ({target_uf2.stat().st_size:,} bytes)")
    elif target_uf2.is_file():
        print(f"Using existing airdrive_firmware.uf2 ({target_uf2.stat().st_size:,} bytes)")

    # 2. Populate test/ directory
    test_dir = web_dir / "test"
    test_dir.mkdir(exist_ok=True)

    files_to_copy = [
        "airdrive.html",
        "tandy_dvi_bezel_full.png",
        "m100-basic.js",
        "airdrive_help.html",
        "airdrive_ota.html",
        "airdrive_ota.js",
        "airdrive_setup.zip",
    ]

    for fn in files_to_copy:
        src = web_dir / fn
        dst = test_dir / fn
        if src.is_file():
            dst.write_bytes(src.read_bytes())
            print(f"  test/{fn} ({dst.stat().st_size:,} bytes)")

    # Copy airdrive.html as test/index.html so https://portacoco.com/test/ loads automatically
    (test_dir / "index.html").write_bytes((web_dir / "airdrive.html").read_bytes())
    print(f"  test/index.html ({test_dir.joinpath('index.html').stat().st_size:,} bytes)")

    # Copy firmware assets if present
    firmware_src = web_dir / "airdrive_firmware"
    firmware_dst = test_dir / "airdrive_firmware"
    if firmware_src.is_dir():
        firmware_dst.mkdir(exist_ok=True)
        for f in firmware_src.iterdir():
            if f.is_file():
                (firmware_dst / f.name).write_bytes(f.read_bytes())
                print(f"  test/airdrive_firmware/{f.name} ({f.stat().st_size:,} bytes)")

    # 3. Create webdeploy.zip
    out_zip = web_dir / "webdeploy.zip"
    if out_zip.exists():
        out_zip.unlink()

    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(test_dir):
            for f in sorted(files):
                full_p = Path(root) / f
                rel_p = full_p.relative_to(web_dir)
                zf.write(full_p, str(rel_p))
        if target_uf2.is_file():
            zf.write(target_uf2, "airdrive_firmware.uf2")

    print(f"\nSuccessfully built: {out_zip} ({out_zip.stat().st_size:,} bytes)")

    # 4. Copy to Desktop
    desktop_zip = Path.home() / "Desktop" / "webdeploy.zip"
    try:
        shutil.copy2(out_zip, desktop_zip)
        print(f"Copied to Desktop for 1-click cPanel upload: {desktop_zip}")
    except Exception as e:
        print(f"Note: Could not copy to Desktop ({e})")

    return 0


if __name__ == "__main__":
    sys.exit(main())
