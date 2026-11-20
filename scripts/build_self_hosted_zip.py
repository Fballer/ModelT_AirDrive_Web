#!/usr/bin/env python3
"""Build the Self-Hostable Offline ZIP Package for Porta MT: AirDrive.

Features included:
  - airdrive.html with APP_CONFIG.enableFirmwareUpdates = false
  - m100-basic.js
  - tandy_dvi_bezel_full.png
  - Start-Mac-Linux.command (executable 1-click launcher)
  - Start-Windows.bat (Windows 1-click launcher)
  - README.txt

Usage:
    python3 scripts/build_self_hosted_zip.py
"""

from __future__ import annotations

import os
import stat
import sys
import zipfile
from pathlib import Path


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    dist_dir = project_root / "dist"
    dist_dir.mkdir(exist_ok=True)
    out_zip = dist_dir / "airdrive_self_hosted.zip"

    # 1. Prepare offline airdrive.html (with enableFirmwareUpdates: false)
    html_src = (project_root / "airdrive.html").read_text(encoding="utf-8")
    if "enableFirmwareUpdates: true" not in html_src:
        print("Error: Could not find 'enableFirmwareUpdates: true' in airdrive.html", file=sys.stderr)
        return 1

    offline_html = html_src.replace("enableFirmwareUpdates: true", "enableFirmwareUpdates: false")

    # 2. Build ZIP archive
    if out_zip.exists():
        out_zip.unlink()

    print(f"Creating self-hostable ZIP at {out_zip}...")
    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        # airdrive.html (customized)
        zf.writestr("airdrive.html", offline_html)

        # Supporting files
        for filename in ("m100-basic.js", "tandy_dvi_bezel_full.png"):
            filepath = project_root / filename
            if filepath.is_file():
                zf.write(filepath, arcname=filename)
            else:
                print(f"Warning: {filename} not found at {filepath}", file=sys.stderr)

        # Launchers and README
        for script_name in ("Start-Windows.bat", "README.txt"):
            script_path = project_root / "scripts" / script_name
            if script_path.is_file():
                zf.write(script_path, arcname=script_name)

        # macOS/Linux launcher with executable permissions (0755)
        mac_cmd = project_root / "scripts" / "Start-Mac-Linux.command"
        if mac_cmd.is_file():
            zinfo = zipfile.ZipInfo("Start-Mac-Linux.command")
            zinfo.external_attr = (stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH) << 16
            zf.writestr(zinfo, mac_cmd.read_bytes())

    # Also copy to MODEL_T_AirDrive_Web if present
    web_dir = project_root.parent / "MODEL_T_AirDrive_Web" / "web_bbs_internet_bridge"
    if web_dir.is_dir():
        web_dest = web_dir / "airdrive_self_hosted.zip"
        import shutil
        shutil.copy2(out_zip, web_dest)
        print(f"Copied package to {web_dest}")

    print("Success! Self-hosted package contents:")
    with zipfile.ZipFile(out_zip, "r") as zf:
        for info in zf.infolist():
            print(f"  - {info.filename} ({info.file_size:,} bytes)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
