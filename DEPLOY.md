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

`airdrive_ota.html` and `airdrive_ota.js` are the update page. It shows the published date and the what's-new notes, then downloads the firmware from `airdrive_firmware/`. **Check my AirDrive** connects and asks the module for its edition date. If the module is older than the published date, **Install this update** appears.

Install writes `OTA` to the module. The module blinks and restarts with the Bluetooth name **AdaDFU**. The page then sends `airdrive_app.zip`. That zip is the application only. The five virtual disks are not in it, and the files on them stay. Chrome asks for AdaDFU as a second Bluetooth choice. Leave the AirDrive plugged in until the page says the update is finished.

Open the update page from the website in Chrome or Edge. A saved file on the computer can check a date, but it cannot download the firmware.

If the module already rebooted and the page lost it, open **The update already restarted my AirDrive** and choose **AdaDFU**.

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

6. In Chrome, open https://www.portacoco.com/airdrive_ota.html. **Check my AirDrive**. If the module is older, **Install this update**. When Chrome asks again, choose **AdaDFU**. Leave power on until the page finishes.

7. If this firmware also changes the BASIC installer on the Tandy, the owner still runs **Install** on the computer afterward. The Bluetooth update does not rewrite the laptop.

USB is the recovery path if a Bluetooth update stops. A failed transfer can leave the module in the bootloader. Plug it in by USB and flash the application zip, not a factory image.

Modules already in the field keep showing the address that was in the firmware when they were programmed. The loader screen says `PortaCoCo.com/airdrive.html` only after a firmware build that contains that lowercase address.
