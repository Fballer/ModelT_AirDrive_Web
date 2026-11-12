/* AirDrive Bluetooth firmware update.
   Speaks the Adafruit / Nordic legacy DFU the Nice!Nano bootloader uses
   after the app writes GPREGRET 0xA8 (webfs command "OTA").
   Application zip only. Factory images are rejected before any byte is sent.
*/
(function (global) {
  const WEBFS_SERVICE = "19b10000-e8f2-537e-4f6c-d104768a1214";
  const WEBFS_WRITE = "19b10001-e8f2-537e-4f6c-d104768a1214";
  const WEBFS_NOTIFY = "19b10002-e8f2-537e-4f6c-d104768a1214";
  const DFU_SERVICE = "19b10010-e8f2-537e-4f6c-d104768a1214";
  const DFU_CONTROL = "19b10011-e8f2-537e-4f6c-d104768a1214";
  const DFU_PACKET = "19b10012-e8f2-537e-4f6c-d104768a1214";

  // Production app slot: 0x26000–0x64000. Larger images are factory-sized.
  const APP_SLOT_MAX = 0x3e000;
  const SD_REQ = 182; // S140 6.1.1, 0x00B6
  const DEVICE_TYPE = 82;
  const PACKET = 20;
  // The updater holds 8 packets. Waiting every 4 leaves room for the one
  // still being stored, and is much faster than waiting after every packet.
  const PRN = 4;
  const OP_START = 1;
  const OP_INIT = 2;
  const OP_RECEIVE = 3;
  const OP_VALIDATE = 4;
  const OP_ACTIVATE = 5;
  const OP_PRN = 8;
  const OP_RESPONSE = 16;
  const OP_RECEIPT = 17;
  const MODE_APP = 4;

  const ERRORS = {
    1: "SUCCESS",
    2: "invalid state",
    3: "not supported",
    4: "image does not fit the application slot",
    5: "CRC error",
    6: "operation failed"
  };

  function fail(msg) {
    const err = new Error(msg);
    err.airdrive = true;
    throw err;
  }

  function u8(bytes) {
    return bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }

  class NotifyQueue {
    constructor(characteristic) {
      this.q = [];
      this.waiters = [];
      characteristic.addEventListener("characteristicvaluechanged", (ev) => {
        const view = ev.target.value;
        const msg = new Uint8Array(view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength));
        if (this.waiters.length) this.waiters.shift().resolve(msg);
        else this.q.push(msg);
      });
    }

    next(timeoutMs) {
      if (this.q.length) return Promise.resolve(this.q.shift());
      return new Promise((resolve, reject) => {
        const waiter = {};
        waiter.t = setTimeout(() => {
          const i = this.waiters.indexOf(waiter);
          if (i >= 0) this.waiters.splice(i, 1);
          reject(new Error("The AirDrive stopped answering. Leave it plugged in and try again."));
        }, timeoutMs);
        waiter.resolve = (msg) => {
          clearTimeout(waiter.t);
          resolve(msg);
        };
        this.waiters.push(waiter);
      });
    }
  }

  async function waitKind(queue, kind, proc, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const left = deadline - Date.now();
      if (left <= 0) fail("Timed out waiting for the bootloader.");
      const msg = await queue.next(left);
      if (msg[0] === OP_RESPONSE && msg[2] !== 1) {
        const step = { 1: "while preparing", 2: "while checking the file", 3: "while receiving", 4: "while checking the copy" }[msg[1]] || "";
        if (msg[2] === 2) {
          fail("The updater is still on the last attempt. Unplug the AirDrive, plug it back in, click Check my AirDrive, and select AirDrive.");
        }
        fail("Bootloader rejected the update (" + (ERRORS[msg[2]] || ("code " + msg[2])) + ")" + (step ? " " + step : "") + ". Leave it plugged in.");
      }
      if (kind === "response" && msg[0] === OP_RESPONSE && msg[1] === proc && msg[2] === 1) return msg;
      if (kind === "receipt" && msg[0] === OP_RECEIPT) return msg;
    }
  }

  async function writeControl(control, bytes) {
    await control.writeValue(u8(bytes));
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function writePacket(packet, bytes) {
    const copy = u8(bytes);
    if (copy.length === 0 || copy.length > PACKET) fail("DFU packet length " + copy.length + " is outside 1–20.");
    let chunk = copy;
    if (chunk.length % 4 !== 0) {
      const padded = new Uint8Array(chunk.length + (4 - (chunk.length % 4)));
      padded.set(chunk);
      chunk = padded;
    }
    await packet.writeValueWithoutResponse(chunk);
  }

  async function parseZip(buffer) {
    if (typeof JSZip === "undefined") fail("JSZip did not load. Check the network and reload.");
    let zip;
    try {
      zip = await JSZip.loadAsync(buffer);
    } catch (e) {
      fail("That file is not a zip. Choose the firmware.zip from pio run.");
    }
    const manifestEntry = zip.file("manifest.json");
    if (!manifestEntry) {
      fail("This zip has no manifest.json. Use firmware.zip from pio run, not a factory UF2.");
    }
    let manifest;
    try {
      manifest = JSON.parse(await manifestEntry.async("string"));
    } catch (e) {
      fail("manifest.json could not be read.");
    }
    const body = manifest.manifest || {};
    const keys = Object.keys(body).filter((k) => k !== "dfu_version");
    if (keys.length !== 1 || keys[0] !== "application") {
      fail("This zip is not an application-only update. Factory images are refused so the five disks are not overwritten.");
    }
    const app = body.application || {};
    const init = app.init_packet_data || {};
    const req = init.softdevice_req || [];
    if (!req.includes(SD_REQ)) fail("This zip is not for the AirDrive SoftDevice (0xB6).");
    if (init.device_type !== DEVICE_TYPE) {
      fail("This zip is for device type " + init.device_type + ", not AirDrive (" + DEVICE_TYPE + ").");
    }
    if (!app.bin_file || !app.dat_file || !zip.file(app.bin_file) || !zip.file(app.dat_file)) {
      fail("The zip is missing the application binary or init packet.");
    }
    const bin = u8(await zip.file(app.bin_file).async("uint8array"));
    const dat = u8(await zip.file(app.dat_file).async("uint8array"));
    if (bin.length === 0 || bin.length > APP_SLOT_MAX) {
      fail("Firmware is " + bin.length + " bytes. An app update must fit in " + APP_SLOT_MAX + " bytes.");
    }
    if (bin.length % 4 !== 0) fail("Firmware length is not a multiple of 4.");
    if (dat.length < 14 || dat.length > 20) fail("Init packet length looks wrong.");
    if (dat[0] !== 0x52 || dat[1] !== 0x00) fail("Init packet is not for this board.");
    const marker = new TextEncoder().encode("OTA DFU: reboot");
    let marked = false;
    for (let i = 0; i <= bin.length - marker.length; i++) {
      let same = true;
      for (let j = 0; j < marker.length; j++) {
        if (bin[i + j] !== marker[j]) { same = false; break; }
      }
      if (same) { marked = true; break; }
    }
    if (!marked) {
      fail("This update cannot be installed from the page.");
    }
    const edition = editionIn(bin);
    if (!edition) fail("This update has no date.");
    return {
      bin: bin,
      dat: dat,
      bytes: bin.length,
      edition: edition,
      deviceType: init.device_type,
      softdevice: SD_REQ
    };
  }

  function editionIn(bytes) {
    const marker = new TextEncoder().encode("EDITION ");
    for (let i = 0; i <= bytes.length - marker.length - 10; i++) {
      let same = true;
      for (let j = 0; j < marker.length; j++) {
        if (bytes[i + j] !== marker[j]) { same = false; break; }
      }
      if (!same) continue;
      let date = "";
      for (let j = 0; j < 10; j++) date += String.fromCharCode(bytes[i + marker.length + j]);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    }
    return null;
  }

  async function readEdition(device) {
    if (!device.gatt.connected) await device.gatt.connect();
    const service = await device.gatt.getPrimaryService(WEBFS_SERVICE);
    const writeChar = await service.getCharacteristic(WEBFS_WRITE);
    const notifyChar = await service.getCharacteristic(WEBFS_NOTIFY);
    await notifyChar.startNotifications();
    const queue = new NotifyQueue(notifyChar);
    const payload = new TextEncoder().encode("VER");
    try {
      await writeChar.writeValueWithoutResponse(payload);
    } catch (e) {
      await writeChar.writeValue(payload);
    }
    const deadline = Date.now() + 2500;
    let text = "";
    while (Date.now() < deadline) {
      let msg;
      try {
        msg = await queue.next(Math.max(250, deadline - Date.now()));
      } catch (e) {
        break;
      }
      text += new TextDecoder().decode(msg);
      const found = text.match(/EDITION (\d{4}-\d{2}-\d{2})/);
      if (found) return found[1];
    }
    return null;
  }

  async function rebootToDfu(device) {
    if (!device.gatt.connected) await device.gatt.connect();
    const service = await device.gatt.getPrimaryService(WEBFS_SERVICE);
    const writeChar = await service.getCharacteristic(WEBFS_WRITE);
    const notifyChar = await service.getCharacteristic(WEBFS_NOTIFY);
    await notifyChar.startNotifications();
    const queue = new NotifyQueue(notifyChar);
    const dropped = new Promise((resolve) => {
      device.addEventListener("gattserverdisconnected", () => resolve("disc"), { once: true });
    });
    const payload = new TextEncoder().encode("OTA");
    try {
      await writeChar.writeValueWithoutResponse(payload);
    } catch (e) {
      await writeChar.writeValue(payload);
    }
    const noted = (async () => {
      const deadline = Date.now() + 4000;
      while (Date.now() < deadline) {
        const msg = await queue.next(Math.max(200, deadline - Date.now()));
        if (new TextDecoder().decode(msg).indexOf("OTA") !== -1) return "ota";
      }
      return "timeout";
    })();
    let which;
    try {
      which = await Promise.race([noted, dropped]);
    } catch (e) {
      which = await Promise.race([
        dropped,
        new Promise((resolve) => setTimeout(() => resolve("timeout"), 1500))
      ]);
    }
    if (which === "timeout") {
      fail("This AirDrive did not start the update. Leave it plugged in. If this keeps happening, it needs a one-time update with the USB cable.");
    }
  }

  async function flashDfu(device, image, onProgress) {
    const report = onProgress || function () {};
    if (!device.gatt.connected) await device.gatt.connect();
    report(0, "Connected. Sending the update.");
    const service = await device.gatt.getPrimaryService(DFU_SERVICE);
    const control = await service.getCharacteristic(DFU_CONTROL);
    const packet = await service.getCharacteristic(DFU_PACKET);
    await control.startNotifications();
    const queue = new NotifyQueue(control);

    report(1, "Preparing your AirDrive. Your files stay.");
    await writeControl(control, [OP_START, MODE_APP]);
    const size = new Uint8Array(12);
    new DataView(size.buffer).setUint32(8, image.bin.length, true);
    await writePacket(packet, size);
    await waitKind(queue, "response", OP_START, 45000);

    report(3, "Starting the update.");
    await writeControl(control, [OP_INIT, 0x00]);
    for (let i = 0; i < image.dat.length; i += PACKET) {
      await writePacket(packet, image.dat.subarray(i, i + PACKET));
    }
    // Windows can deliver the completion before the file check bytes.
    await delay(150);
    await writeControl(control, [OP_INIT, 0x01]);
    await waitKind(queue, "response", OP_INIT, 20000);

    await writeControl(control, [OP_PRN, PRN & 0xff, (PRN >> 8) & 0xff]);
    await writeControl(control, [OP_RECEIVE]);

    let sentPackets = 0;
    const bin = image.bin;
    for (let off = 0; off < bin.length; off += PACKET) {
      const chunk = bin.subarray(off, Math.min(off + PACKET, bin.length));
      if (chunk.length % 4 !== 0) fail("Firmware chunk is not a multiple of 4.");
      await writePacket(packet, chunk);
      sentPackets += 1;
      const more = off + chunk.length < bin.length;
      if (sentPackets % PRN === 0 && more) await waitKind(queue, "receipt", 0, 15000);
      if (sentPackets % 10 === 0 || !more) {
        report(Math.min(99, Math.floor(((off + chunk.length) / bin.length) * 96) + 3), "Sending the update… Stay on this page. Do not press buttons on the AirDrive. About 3 minutes.");
      }
    }
    await waitKind(queue, "response", OP_RECEIVE, 30000);
    report(99, "Checking the update.");
    await writeControl(control, [OP_VALIDATE]);
    await waitKind(queue, "response", OP_VALIDATE, 20000);
    report(100, "Restarting your AirDrive.");
    try {
      await writeControl(control, [OP_ACTIVATE]);
    } catch (e) {
      /* Activate resets the chip. A dropped link here is the success path. */
    }
  }

  function pickAirDrive() {
    return navigator.bluetooth.requestDevice({
      filters: [{ services: [WEBFS_SERVICE] }]
    });
  }

  function pickCheck() {
    return navigator.bluetooth.requestDevice({
      filters: [
        { services: [WEBFS_SERVICE] },
        { name: "AirDrive" },
        { services: [DFU_SERVICE] }
      ],
      optionalServices: [WEBFS_SERVICE, DFU_SERVICE, DFU_CONTROL, DFU_PACKET]
    });
  }

  async function isUpdater(device) {
    const name = device.name || "";
    if (name === "AirDrive") return true;
    if (name.indexOf("Model T") === 0) return false;
    if (!device.gatt.connected) await device.gatt.connect();
    try {
      await device.gatt.getPrimaryService(DFU_SERVICE);
    } catch (e) {
      return false;
    }
    try {
      await device.gatt.getPrimaryService(WEBFS_SERVICE);
      return false;
    } catch (e) {
      return true;
    }
  }

  function pickDfu() {
    return navigator.bluetooth.requestDevice({
      filters: [{ name: "AirDrive" }, { services: [DFU_SERVICE] }]
    });
  }

  global.AirDriveOta = {
    APP_SLOT_MAX: APP_SLOT_MAX,
    parseZip: parseZip,
    readEdition: readEdition,
    rebootToDfu: rebootToDfu,
    flashDfu: flashDfu,
    pickAirDrive: pickAirDrive,
    pickCheck: pickCheck,
    isUpdater: isUpdater,
    pickDfu: pickDfu
  };
})(window);
