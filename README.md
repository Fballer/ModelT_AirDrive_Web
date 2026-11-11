# Porta MT AirDrive — Web Bluetooth

Public Web Bluetooth manager for Porta MT AirDrive. Open this site in **Chrome** or **Edge** (not Safari/Firefox), power the AirDrive, then click **Connect AirDrive**.

**Use it here:** https://fballer.github.io/ModelT_AirDrive_Web/

On a Mac, do not pair the AirDrive in System Settings. Forget it there if needed, then pair only from this page.

**Check for updates** is [airdrive_ota.html](airdrive_ota.html). It shows the date of the latest version and installs `airdrive_firmware/airdrive_app.zip`. Your files stay.

PortaCoCo hosts more than AirDrive, so every AirDrive file uses a lowercase `airdrive` name. The disk manager on that site is `airdrive.html` only. Linux treats `Airdrive.html` as a different file, so deploys must not upload that name.

The full guide is [DEPLOY.md](DEPLOY.md): how the pages work, every file the site needs, how to extract the update onto PortaCoCo, and how to publish the next firmware. Rebuild the cPanel package with `python3 scripts/build_airdrive_deploy.py` from the firmware project. The zip is `airdrive_deploy.zip`. Extract it in the site folder that already holds these files.

| File | What it is |
|---|---|
| `airdrive.html` | Disk manager. All lowercase. People may copy only this page. |
| `airdrive_help.html` | Help. The manager always opens it on portacoco.com. |
| `airdrive_ota.html` | Update page. The manager always opens it on portacoco.com. |
| `airdrive_ota.js` | Bluetooth update code used by the update page. |
| `airdrive_firmware/airdrive_app.zip` | Application-only firmware. Does not include the five virtual disks. |
| `airdrive_firmware/airdrive_info.json` | Published date, notes, and the zip name. |
