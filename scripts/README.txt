================================================================================
Porta MT: AirDrive - Self-Hostable Offline Web Bluetooth Suite
================================================================================

Welcome to the self-hosted offline distribution of Porta MT: AirDrive Manager.
This package allows you to use your AirDrive completely independently from
portacoco.com, even without an active internet connection.

--------------------------------------------------------------------------------
1. IMPORTANT: WHY YOU CANNOT OPEN airdrive.html DIRECTLY (file://)
--------------------------------------------------------------------------------
Modern browsers (Google Chrome, Microsoft Edge, Opera, Chromium) strictly require
a secure origin (https://) or http://localhost to access the Web Bluetooth API.

Opening `airdrive.html` directly via double-click creates a `file://` URL, which
Chrome explicitly disables Bluetooth access for.

To use the manager, launch the included 1-click script:
- On macOS / Linux: Double-click `Start-Mac-Linux.command`
- On Windows:       Double-click `Start-Windows.bat`

This starts a lightweight local HTTP server at http://localhost:8080 and opens
the manager in your default browser automatically.

--------------------------------------------------------------------------------
2. FEATURES INCLUDED IN THIS PACKAGE
--------------------------------------------------------------------------------
- Tab 1: Virtual Floppy (TPDD) - Full 5-disk virtual floppy drive manager,
  backing up and restoring disks, and binary BASIC tokenization/detokenization.
- Tab 2: Virtual DVI (AirDVI) - High-speed wireless 80x24 CRT monitor emulator
  with borderless & full rig modes, CRT phosphor colors, scanlines, and curved glass.
- Tab 3: Web / BBS (Internet Bridge) - Live Weather, Local & Tech News feeds,
  curated Telnet BBS speed dial presets, and custom ATDT dialer.
- Tab 4: Help & Reference - Complete documentation for Model 100/102 and Model 200.

--------------------------------------------------------------------------------
3. FIRMWARE UPDATES ARE EXCLUSIVE TO PORTACOCO.COM
--------------------------------------------------------------------------------
For safety, warranty validation, and bootloader integrity, firmware flashing
binaries and OTA update controls are excluded from this offline package
(`APP_CONFIG.enableFirmwareUpdates = false`).

To update your AirDrive firmware wirelessly or verify the latest release:
Visit https://www.portacoco.com/airdrive.html

--------------------------------------------------------------------------------
4. WEBSOCKET-TO-TELNET PROXY & OFFLINE BBS CONFIGURATION
--------------------------------------------------------------------------------
Browsers cannot create raw TCP Telnet sockets. The Web / BBS Bridge connects to
BBSes via a WebSocket-to-Telnet proxy.

By default, the proxy is configured to:
  wss://telnet.retrograde.fun:8080/

If you are running completely offline or hosting your own local BBS:
1. Run websockify or any WebSocket telnet bridge:
   websockify 8080 localhost:23
2. On Tab 3 (Web / BBS) -> Proxy Settings, set your WebSocket Proxy URL to:
   ws://localhost:8080/
3. Click "Save Proxy Settings".

© 2026 PortaCoCo. All rights reserved.
Visit https://www.portacoco.com/ for more retro computing hardware and software.
================================================================================
