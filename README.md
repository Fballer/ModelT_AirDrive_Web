# Porta MT AirDrive — Web Bluetooth

Public Web Bluetooth manager for Porta MT AirDrive. Open it in **Chrome** or **Edge** (not Safari/Firefox).

**Live site:** https://www.portacoco.com/airdrive.html

GitHub Pages copy: https://fballer.github.io/ModelT_AirDrive_Web/

Firmware source: https://github.com/Fballer/ModelT_AirDrive

On a Mac, do not pair the AirDrive in System Settings. Forget it there if needed, then pair only from this page. On Windows, if Bluetooth settings already has it as a keyboard, remove it there first, then select it on this page.

**HELP File** and **Check for updates** always open PortaCoCo.com, even when this folder is opened from GitHub.

## Owner: update the AirDrive

The five virtual disks stay. Save a backup from the disk manager first if you want.

1. Open https://www.portacoco.com/airdrive_ota.html in Chrome or Edge.
2. Click **Check my AirDrive**. Pick **Model T AirDrive**.
3. If the page offers a newer date, click **Install this update**. Stay on the page about 10 minutes. Keep the computer awake.
4. The bar may stop at about **8%**. That is normal. Click **Select AirDrive** on the page and pick **AirDrive**, not Model T AirDrive.
5. Do not press buttons on the AirDrive itself. Do not press Back or reload. Do not let the laptop sleep.

If Check my AirDrive finds **no date**, that unit still needs the one-time Windows USB setup (`airdrive_setup.zip`). Do not send firmware from the page to that unit.

After the module firmware is current, reload the Tandy programs. Firmware does not write AIRDRV by itself:

1. In BASIC: `KILL "AIRDRV.BA"` then `KILL "TSLOAD.CO"`.
2. Model 100 or 102: `RUN "COM:98N1E"` and **short-press Install**.
3. Model 200: `RUN "COM:98N1ENN"` and **hold Install for 3+ seconds**.
4. The screen says **Now Press F4=AirDrive or F8=Main Menu**.

## Deploy

Full checklist: [DEPLOY.md](DEPLOY.md). Rebuild the cPanel package from the firmware project:

```
python3 scripts/build_airdrive_deploy.py
```

The zip is `airdrive_deploy.zip`. Extract it in the PortaCoCo folder that already holds these files. Never upload `Airdrive.html`.

| File | What it is |
|---|---|
| `airdrive.html` | Disk manager. All lowercase. |
| `m100-basic.js` | BASIC convert used by the disk manager. |
| `airdrive_help.html` | Help. The manager always opens it on portacoco.com. |
| `airdrive_ota.html` | Update page. The manager always opens it on portacoco.com. |
| `airdrive_ota.js` | Bluetooth update code used by the update page. |
| `airdrive_firmware/airdrive_app.zip` | Application-only firmware. Does not include the five virtual disks. |
| `airdrive_firmware/airdrive_info.json` | Published date, notes, and the zip name. |
| `airdrive_setup.zip` | One-time Windows USB setup for beta units and new boards. |
