# AirDrive website and firmware updates

This is the checklist for the public AirDrive site. The live page owners use is:

https://www.portacoco.com/airdrive.html

The manager file is `airdrive.html`, all lowercase. That is the only manager name. `Airdrive.html` is a different file on the Linux server and must not be uploaded.

GitHub holds the copy you deploy from. PortaCoCo is the site owners open. **HELP File** and **Check for updates** on the manager always go to portacoco.com, even when the manager itself is opened from GitHub Pages.

## How the pages work

`airdrive.html` is the disk manager. In Chrome or Edge, **Connect AirDrive** talks to the module named **Model T AirDrive** and shows the five virtual disks. From there an owner can copy, rename, delete, format, and back up or restore disks. The five disks stay on the module. This page does not change firmware.

Two buttons leave the manager and always open the official site:

- **HELP File** opens https://www.portacoco.com/airdrive_help.html
- **Check for updates** opens https://www.portacoco.com/airdrive_ota.html

**Check for updates** is the dark button on the right. It is easy to miss. There is no button named "Update firmware."

Someone may copy only `airdrive.html` and host that one page somewhere else. Disk connect and backup still work. Help and updates still open portacoco.com. They do not get a copy of the firmware.

`airdrive_help.html` is the owner help page.

`airdrive_ota.html` and `airdrive_ota.js` are the update page. It shows the published date and the what's-new notes. **Check my AirDrive** connects and asks the module for its edition date. Select **Model T AirDrive** in that list.

**Check my AirDrive** asks the module for its edition date.

- No date means one of the first ten beta units. The page shows the one-time Windows setup and the **Download AirDrive Setup** button. Those units still have the stock updater, which Chrome cannot talk to. They do not get an Install button.
- A date means the new updater is already installed. If that date is older than the page, **Install this update** restarts the AirDrive. The next list says **AirDrive**. Select that. The five disks are not in the firmware file.
- The same date means it is already current. A newer date than the page means leave it.

Chrome still blocks the old Nordic update service (`00001530-1212-efde-1523-785feabcd123`). The new updater uses a private AirDrive service instead, and it advertises as **AirDrive**. The running module still advertises as **Model T AirDrive**.

## Files required on portacoco.com

All of these sit in the same folder as the existing `airdrive.html`. Names are lowercase.

| File | Required | What it is |
|---|---|---|
| `airdrive.html` | yes | Disk manager. The only manager filename. |
| `airdrive_help.html` | yes | Help page. |
| `airdrive_ota.html` | yes | Update page. |
| `airdrive_ota.js` | yes | Bluetooth update code used by the update page. |
| `airdrive_firmware/airdrive_app.zip` | yes | Application-only firmware. Does not include the five disks. |
| `airdrive_firmware/airdrive_info.json` | yes | Published date, what's-new text, and the zip filename. |
| `airdrive_setup.zip` | yes | One-time Windows installer for beta units and for new boards before the case is closed. |

`index.html` is only the GitHub Pages copy of the manager. It is not part of the PortaCoCo upload.

## Deploy the website

On the Mac, from either firmware project folder (`MODEL_T_AirDrive` or `MODEL_T_AirDrive-model-200-loader`):

```
python3 scripts/build_airdrive_deploy.py
```

That writes `MODEL_T_AirDrive_Web/airdrive_deploy.zip`. The manager inside the zip is `airdrive.html`. The script refuses `Airdrive.html`.

In InMotion cPanel File Manager:

1. Open the folder that already contains `airdrive.html`.
2. Upload `airdrive_deploy.zip` into that folder.
3. Extract it and allow the overwrite.
4. Delete `airdrive_deploy.zip` from the server so the site is not also hosting the package.
5. If a capital-A `Airdrive.html` is still in that folder, delete it.

Then check:

- https://www.portacoco.com/airdrive.html shows **Check for updates**
- https://www.portacoco.com/airdrive_ota.html shows the latest date

A website-only change uses this same zip. Skip the firmware build below when the firmware itself did not change.

## Deploy new firmware

Build the firmware in the production tree, `MODEL_T_AirDrive-model-200-loader`. That tree is the one with the OTA command and the edition date. The zip must be the application from `pio run`. A factory image includes the five disks and can erase the owner's files. Do not publish `dist/AirDrive-factory.uf2` or `dist/AirDrive-nicenano.zip`.

1. Set the date owners will see. In `include/airdrive_edition.h`:

   ```
   #define AIRDRIVE_EDITION_DATE "YYYY-MM-DD"
   ```

2. Write one paragraph of owner notes in `docs/airdrive_whats_new.txt`.

3. Build:

   ```
   pio run -e tenstar_promicro
   ```

   The application zip is `.pio/build/tenstar_promicro/firmware.zip`.

4. Stage it into the website folder:

   ```
   python3 scripts/stage_ota_zip.py
   ```

   The script refuses a zip that is not application-only, is for the wrong device, has no OTA command, or has no edition date. On success it writes:

   - `MODEL_T_AirDrive_Web/airdrive_firmware/airdrive_app.zip`
   - `MODEL_T_AirDrive_Web/airdrive_firmware/airdrive_info.json`

   The update page reads that json. The date and notes on the page come from it.

5. Pack and upload the site again:

   ```
   python3 scripts/build_airdrive_deploy.py
   ```

   Extract `airdrive_deploy.zip` in cPanel the same way as a website deploy. Replacing the whole zip also refreshes the update page. Uploading only the `airdrive_firmware` folder is enough when the HTML did not change, because the page loads the date and notes from `airdrive_info.json`.

6. In Chrome, open https://www.portacoco.com/airdrive_ota.html. **Check my AirDrive** and select **Model T AirDrive**. A unit that already has the new updater and an older date can install from the page. Select **AirDrive** in the second list. A unit with no date is a beta unit and must use the Windows setup below. Do not try to send the firmware to a beta unit from the page.

7. If this firmware also changes the BASIC installer on the Tandy, the owner still runs **Install** on the computer afterward. The Bluetooth update does not rewrite the laptop.

After the new updater is installed, losing power during a website update brings the module back on Bluetooth as **AirDrive**, so the owner can click **Select AirDrive** and try again. USB stays hidden. Before that updater is installed, a power loss after the send has started can leave the stock updater on USB only. That is why the ten beta units, and every new board, get the Windows program once before the case stays closed.

Modules already in the field keep showing the address that was in the firmware when they were programmed. The loader screen says `PortaCoCo.com/airdrive.html` only after a firmware build that contains that lowercase address.

## The installer, now and later

`airdrive_setup.zip` is the program used for the ten beta units and for every new AirDrive before the case is closed. It is not a factory image. It does not load the five disks.

On Windows, the owner unzips it and runs `airdrive_setup.bat`. That file runs `airdrive_setup.ps1`. The program waits for a drive named **NICENANO**, copies `airdrive_firmware.uf2`, waits for the drive to leave, asks for a second double-press of reset, then copies `airdrive_bootloader.uf2`.

On a Mac, the same folder can be tested with:

```
python3 airdrive_setup.py
```

Use an open board. Back up all five disks first. The updater file is staged in flash that overlaps the end of the disk storage, so a disk can look wrong afterward. Restore from the backup if that happens. Do not pull power while either file is copying. Replacing the updater is the one step that, if interrupted, can need a hardware programmer rather than the USB drive.

New boards use this same zip once, with the case still open, before the disks are loaded and the case is closed. After that, later firmware goes through the website only.

## Rebuild the beta zip

Do this when the one-time program, the updater, or the firmware inside that zip changes. The website firmware in `airdrive_firmware/` can be newer than the copy inside the beta zip. Keep them the same when you publish, so a beta unit finishes on the same date the page is offering.

1. Build the application in `MODEL_T_AirDrive-model-200-loader`:

   ```
   pio run -e tenstar_promicro
   ```

2. Build the updater in `AirDrive-bootloader`. Use the PlatformIO ARM compiler, not the system one:

   ```
   export PATH="$HOME/.platformio/packages/toolchain-gccarmnoneeabi/bin:$PATH"
   make BOARD=nice_nano
   ```

   The updater must still start at `0xF4000`. The make step that packs a SoftDevice zip can fail if `adafruit-nrfutil` is not installed. The hex is already written by then. Make the two UF2 files with:

   ```
   python3 lib/uf2/utils/uf2conv.py -f 0xd663823c -c -o airdrive_bootloader.uf2 _build/build-nice_nano/nice_nano_bootloader-0.6.2-dirty_nosd.hex
   python3 lib/uf2/utils/uf2conv.py -f 0xADA52840 -c -o airdrive_firmware.uf2 /path/to/firmware.hex
   ```

   `firmware.hex` is `.pio/build/tenstar_promicro/firmware.hex`. The application UF2 must start at `0x26000` and end before `0x64000`.

3. Copy both UF2 files into `MODEL_T_AirDrive_Web`, next to `airdrive_setup.bat`. Edit `airdrive_setup_help.txt` when the owner steps change, and keep the same steps on `airdrive_ota.html`.

4. Pack the beta download:

   ```
   python3 scripts/build_airdrive_setup.py
   ```

   That writes `airdrive_setup.zip`. Then pack the site with `python3 scripts/build_airdrive_deploy.py` from a firmware tree and extract it in cPanel as usual.

The updater source is the Adafruit nRF52 bootloader 0.6.2, checked out at `AirDrive-bootloader`. It is not pushed back to Adafruit. The AirDrive changes are the private Bluetooth service `19b10010-e8f2-537e-4f6c-d104768a1214`, the control and packet IDs `19b10011` and `19b10012`, the advertised name **AirDrive**, and Bluetooth with no timeout when a normal power-on finds no valid application. Double-press reset still opens the **NICENANO** USB drive.
