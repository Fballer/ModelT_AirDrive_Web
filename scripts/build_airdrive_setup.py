#!/usr/bin/env python3
"""Pack airdrive_setup.zip for the one-time Windows installer.

The zip is what the beta page downloads. It holds one Windows program,
the help text, the application UF2, and the updater UF2.
Run this from MODEL_T_AirDrive_Web after those files are in this folder.
"""

import struct
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "airdrive_setup.zip"
APP_END = 0x64000
BOOT_FAMILY = 0xD663823C
APP_FAMILY = 0xADA52840

MEMBERS = (
    "airdrive_setup.bat",
    "airdrive_setup_help.txt",
    "airdrive_firmware.uf2",
    "airdrive_bootloader.uf2",
)


def uf2_span(path):
    data = path.read_bytes()
    if len(data) % 512:
        raise SystemExit(path.name + " is not a UF2 file")
    lo, hi, families = 0xFFFFFFFF, 0, set()
    for off in range(0, len(data), 512):
        magic, _, _, addr, size, _, _, family = struct.unpack_from("<IIIIIIII", data, off)
        if magic != 0x0A324655:
            raise SystemExit(path.name + " is not a UF2 file")
        lo, hi = min(lo, addr), max(hi, addr + size)
        families.add(family)
    return lo, hi, families


def main():
    missing = [name for name in MEMBERS if not (ROOT / name).is_file()]
    if missing:
        raise SystemExit("missing: " + ", ".join(missing))

    app_lo, app_hi, app_fam = uf2_span(ROOT / "airdrive_firmware.uf2")
    if app_fam != {APP_FAMILY} or app_lo < 0x26000 or app_hi > APP_END:
        raise SystemExit(
            "airdrive_firmware.uf2 must be the application only, "
            "from 0x26000 through before 0x64000"
        )

    boot_lo, boot_hi, boot_fam = uf2_span(ROOT / "airdrive_bootloader.uf2")
    if boot_fam != {BOOT_FAMILY} or boot_hi > 0x10001200:
        raise SystemExit("airdrive_bootloader.uf2 is not the AirDrive updater")
    if not (0xF4000 <= boot_hi and boot_lo <= 0xF4000):
        raise SystemExit("updater UF2 does not cover the bootloader at 0xF4000")

    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name in MEMBERS:
            zf.write(ROOT / name, name)
    print("wrote", OUT, "with", ", ".join(MEMBERS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
