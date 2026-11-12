$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

function Find-NiceNano {
    $vol = Get-CimInstance -ClassName Win32_Volume -ErrorAction SilentlyContinue |
        Where-Object { $_.Label -eq "NICENANO" -and $_.DriveLetter } |
        Select-Object -First 1
    if ($vol) { return $vol.DriveLetter }
    return $null
}

function Wait-NiceNano([string]$message) {
    Write-Host $message
    while ($true) {
        $drive = Find-NiceNano
        if ($drive) { return $drive }
        Start-Sleep -Seconds 1
    }
}

function Wait-Gone {
    $deadline = (Get-Date).AddSeconds(30)
    while ((Get-Date) -lt $deadline) {
        if (-not (Find-NiceNano)) { return }
        Start-Sleep -Milliseconds 400
    }
}

Write-Host "AirDrive one-time setup"
Write-Host "Back up all 5 disks before this. The updater step can touch the end of the disk storage."
Write-Host ""

$firmware = Join-Path $here "airdrive_firmware.uf2"
$updater = Join-Path $here "airdrive_bootloader.uf2"
if (-not (Test-Path $firmware) -or -not (Test-Path $updater)) {
    Write-Host "This folder is missing airdrive_firmware.uf2 or airdrive_bootloader.uf2."
    Write-Host "Unzip the whole download and run airdrive_setup.bat from that folder."
    exit 1
}

$drive = Wait-NiceNano "Double-press reset until a drive named NICENANO appears. Waiting..."
Write-Host "Copying the firmware to $drive"
Copy-Item -Force $firmware (Join-Path $drive "airdrive_firmware.uf2")
Write-Host "Waiting for the drive to go away..."
Wait-Gone

Write-Host ""
Write-Host "Press reset twice again. The NICENANO drive should come back."
$drive = Wait-NiceNano "Waiting for NICENANO..."
Write-Host "Copying the updater to $drive"
Copy-Item -Force $updater (Join-Path $drive "airdrive_bootloader.uf2")
Write-Host "Waiting for the drive to go away..."
Wait-Gone

Write-Host ""
Write-Host "Finished. Unplug the cable, close the case, and put the batteries back."
Write-Host "Then check the AirDrive on the update page. A date means it worked."
