# Lychee Desktop — Windows Installer

This directory contains the NSIS-based Windows installer for **Lychee Desktop** — a proper `.exe` setup wizard with Start Menu integration, Desktop shortcuts, Add/Remove Programs registration, and file associations.

## Files

| File | Description |
|------|-------------|
| `installer.nsi` | NSIS installer script (the source) |
| `build-installer.ps1` | PowerShell script to build the installer |
| `quick-install.bat` | Simple double-click batch installer (no NSIS required) |
| `README.md` | This file |

## Quick Start

### Prerequisites

- **Windows 10 / 11** (64-bit) or Windows Server 2016+
- **lychee-desktop.exe** — build it first:
  ```powershell
  cd ..
  wails build --platform windows/amd64
  ```
  This produces `build\bin\lychee-desktop.exe`.

### Build the Installer

```powershell
.\build-installer.ps1
```

This will:
1. Check if **NSIS** is installed (auto-installs via `winget` if missing)
2. Locate `lychee-desktop.exe` (auto-detects `build\bin\`, `dist\`, or project root)
3. Run `makensis` to compile the installer
4. Output `..\dist\Lychee-Desktop-1.0.0-Setup.exe`

### Build Options

```powershell
# Specify a custom exe path
.\build-installer.ps1 -ExePath "C:\custom\lychee-desktop.exe"

# Specify version
.\build-installer.ps1 -Version "2.0.0"

# Clean previous output before building
.\build-installer.ps1 -Clean
```

## Using the Installer

### Normal Install (GUI)

Double-click `Lychee-Desktop-1.0.0-Setup.exe` and follow the wizard:
1. Welcome page
2. Choose install directory (default: `C:\Program Files\Lychee Desktop`)
3. Install — including WebView2 Runtime if needed
4. Option to launch after install

### Silent Install

```powershell
# Silent install (no UI)
.\Lychee-Desktop-1.0.0-Setup.exe /S

# Silent install + launch after
.\Lychee-Desktop-1.0.0-Setup.exe /S /R
```

### Uninstall

- **GUI:** `Control Panel` → `Programs and Features` → `Lychee Desktop` → Uninstall
- **Silent:** `"$env:ProgramFiles\Lychee Desktop\uninstall.exe" /S`
- **Start Menu:** `Start` → `Lychee Desktop` → `Uninstall Lychee Desktop`

## What Gets Installed

| Item | Location |
|------|----------|
| **Application** | `C:\Program Files\Lychee Desktop\lychee-desktop.exe` |
| **Uninstaller** | `C:\Program Files\Lychee Desktop\uninstall.exe` |
| **Start Menu** | `Start Menu\Programs\Lychee Desktop\Lychee Desktop.lnk` |
| **Desktop** | `Desktop\Lychee Desktop.lnk` |
| **Quick Launch** | `Quick Launch\Lychee Desktop.lnk` |
| **Registry** | `HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\LycheeTech Lychee Desktop` |

## File Associations

| Extension | Description |
|-----------|-------------|
| `.lychee` | Lychee Configuration File — opens in Lychee Desktop |
| `.lychee-pipeline` | Lychee Pipeline File — opens in Lychee Desktop |

**Custom protocol:** `lychee://` links open in Lychee Desktop.

## Pipeline Sharing

Lychee Desktop supports sharing pipelines in multiple ways:

### Export / Import (.lychee-pipeline files)
- **Export**: From the Pipeline Builder toolbar, click **Export** to download your pipeline as a `.lychee-pipeline` JSON file. The file includes pipeline name, version, all stages with their model, prompt, temperature, and max token settings.
- **Import**: Click **Import** in the toolbar and select a `.lychee-pipeline` file to load it into the builder. Pipelines can be shared as files and loaded on any Lychee Desktop instance.
- Double-clicking a `.lychee-pipeline` file in Windows Explorer will open it in Lychee Desktop (when file association is registered via the installer).

### Share via Link
- Click **Share** in the Pipeline Builder toolbar to copy a shareable URL to your clipboard. The pipeline is base64-encoded into the URL, making it easy to share via chat, email, or any messaging platform.
- When someone opens the shared URL, the pipeline auto-loads into their Pipeline Builder.
- Example: `lychee://pipeline?pipeline=<base64-encoded-data>`

### Pipeline File Format
The `.lychee-pipeline` file is a JSON document with the following structure:
```json
{
  "name": "Lychee Pipeline",
  "version": "1.0.0",
  "createdAt": "2026-06-17T04:28:00.000Z",
  "stages": [
    {
      "id": "stage_abc123",
      "model": "llama3.2",
      "prompt": "Summarize the following text...",
      "temperature": 0.7,
      "maxTokens": 2048,
      "status": "idle",
      "output": "",
      "error": ""
    }
  ]
}
```

## Quick Install (No NSIS Required)

If you don't want to build a full installer, run the lightweight batch script:

```batch
quick-install.bat
```

This copies `lychee-desktop.exe` to `%LOCALAPPDATA%\Programs\Lychee Desktop\` and creates shortcuts — no admin privileges required, no NSIS needed.

## How to Download the Installer

### Option 1: GitHub Releases (Recommended)

Get the latest pre-built installer from the [Releases page](https://github.com/lychee-dev/lychee-desktop/releases):

1. Go to **https://github.com/lychee-dev/lychee-desktop/releases**
2. Find the latest release
3. Download `Lychee-Desktop-{version}-Setup.exe` from the **Assets** section
4. Run the `.exe` to install

### Option 2: Build from Source

```powershell
# 1. Clone the repo
git clone https://github.com/lychee-dev/lychee-desktop.git
cd lychee-desktop

# 2. Build the Wails app
wails build --platform windows/amd64

# 3. Build the NSIS installer
cd installer
.\build-installer.ps1

# 4. Installer is at: ..\dist\Lychee-Desktop-1.0.0-Setup.exe
```

### Option 3: CI/CD (GitHub Actions)

The included GitHub Actions workflow (`.github/workflows/build-desktop.yml`) builds the installer automatically on each release. Add an NSIS build step to the workflow to automate installer creation on every release tag.

Example workflow addition:

```yaml
- name: Install NSIS
  run: choco install nsis -y

- name: Build NSIS Installer
  shell: pwsh
  run: |
    cd installer
    .\build-installer.ps1 -Version ${{ github.ref_name }}

- name: Upload Installer
  uses: actions/upload-artifact@v4
  with:
    name: Lychee-Desktop-Installer
    path: dist/Lychee-Desktop-*-Setup.exe
```

## Requirements

- **Windows 10 / 11** (64-bit) or Windows Server 2016+
- **WebView2 Runtime** (auto-installed by the installer if missing)
- **NSIS 3.x** to build the installer from source

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `makensis` not found | The PowerShell script auto-installs NSIS via winget. If that fails, install manually from [nsis.sourceforge.io](https://nsis.sourceforge.io/Download) |
| `lychee-desktop.exe` not found | Build the app first: `cd .. && wails build --platform windows/amd64` |
| Installer won't run | Right-click → **Run as Administrator**. NSIS installers require admin rights for system-wide install. |
| WebView2 error | Download manually from [Microsoft](https://go.microsoft.com/fwlink/p/?LinkId=2124703) |
| "Windows protected your PC" | Click **More info** → **Run anyway**. This appears because the installer isn't code-signed. |
| Wrong architecture | Make sure you built the `amd64` (x64) target, not ARM64. |

## Code Signing (Optional)

To avoid the SmartScreen warning, sign your installer with a code signing certificate:

```nsis
# In installer.nsi, uncomment and configure:
!finalize 'signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /a "%1"'
```

Then in `build-installer.ps1`, set the `SIGNTOOL` environment variable before building, or configure the NSIS `!finalize` directive.
