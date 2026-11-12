#!/usr/bin/env python3
"""One-time AirDrive setup for a Mac test of the same files the Windows program copies.

Double-press reset so the NICENANO drive appears. This copies the application,
waits for the drive to leave, then asks for a second double-press and copies
the updater. It does not write a factory image and it does not format the disks.
The updater copy can still touch the end of the disk storage, so back up first.
"""

import shutil
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
FIRMWARE = HERE / "airdrive_firmware.uf2"
UPDATER = HERE / "airdrive_bootloader.uf2"


def find_volume():
    if sys.platform == "win32":
        import string
        import ctypes

        kernel = ctypes.windll.kernel32
        buf = ctypes.create_unicode_buffer(261)
        for letter in string.ascii_uppercase:
            root = letter + ":\\"
            if kernel.GetVolumeInformationW(root, buf, 261, None, None, None, None, 0):
                if buf.value == "NICENANO":
                    return Path(root)
        return None
    path = Path("/Volumes/NICENANO")
    return path if path.is_dir() else None


def wait_volume(message):
    print(message, flush=True)
    while True:
        vol = find_volume()
        if vol:
            return vol
        time.sleep(0.5)


def wait_gone():
    deadline = time.time() + 30
    while time.time() < deadline:
        if find_volume() is None:
            return
        time.sleep(0.4)


def main():
    if not FIRMWARE.is_file() or not UPDATER.is_file():
        print("This folder is missing airdrive_firmware.uf2 or airdrive_bootloader.uf2.")
        print("Unzip the whole download and run this script from that folder.")
        return 1
    print("Back up all 5 disks before this. The updater step can touch the end of the disk storage.")
    vol = wait_volume("Double-press reset until NICENANO appears. Waiting...")
    print("Copying the firmware.", flush=True)
    shutil.copy(FIRMWARE, vol / "airdrive_firmware.uf2")
    print("Waiting for the drive to go away.", flush=True)
    wait_gone()
    vol = wait_volume("Press reset twice again. Waiting for NICENANO...")
    print("Copying the updater.", flush=True)
    shutil.copy(UPDATER, vol / "airdrive_bootloader.uf2")
    print("Waiting for the drive to go away.", flush=True)
    wait_gone()
    print("Finished. Unplug the cable, close the case, and put the batteries back.")
    print("Then check the AirDrive on the update page. A date means it worked.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
