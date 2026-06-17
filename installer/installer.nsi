; -----------------------------------------------------------------------
; Lychee Desktop — NSIS Windows Installer
; -----------------------------------------------------------------------
; Build:  makensis /DEXE_PATH=..\build\bin\lychee-desktop.exe installer.nsi
;         or use build-installer.ps1
; -----------------------------------------------------------------------

Unicode true
ManifestDPIAware true
ManifestSupportedOS all

; ── Product Info ──────────────────────────────────────────────────────
!define PRODUCT_NAME           "Lychee Desktop"
!define PRODUCT_PUBLISHER      "Lychee Tech"
!define PRODUCT_VERSION        "1.0.0"
!define PRODUCT_VERSION_FULL   "${PRODUCT_VERSION}.0"
!define PRODUCT_EXECUTABLE     "lychee-desktop.exe"
!define PRODUCT_DESCRIPTION    "Native desktop app for Lychee — universal LLM runtime"
!define PRODUCT_COPYRIGHT      "© 2026 Lychee Tech"
!define PRODUCT_WEBSITE        "https://lychee.dev"
!define PRODUCT_UNINST_KEY     "Software\Microsoft\Windows\CurrentVersion\Uninstall\LycheeTech Lychee Desktop"
!define PRODUCT_REG_KEY        "Software\Lychee Tech\Lychee Desktop"
!define PRODUCT_STARTMENU      "Lychee Desktop"

; ── Default paths (can be overridden with /D on makensis CLI) ────────
!ifndef EXE_PATH
    !define EXE_PATH           "..\build\bin\lychee-desktop.exe"
!endif
!ifndef ICON_PATH
    !define ICON_PATH          "..\build\windows\icon.ico"
!endif
!ifndef OUTPUT_DIR
    !define OUTPUT_DIR         "..\dist"
!endif

; ── Includes ──────────────────────────────────────────────────────────
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "WinVer.nsh"

; ── Installer Attributes ──────────────────────────────────────────────
Name "${PRODUCT_NAME}"
OutFile "${OUTPUT_DIR}\Lychee-Desktop-${PRODUCT_VERSION}-Setup.exe"
InstallDir "$PROGRAMFILES64\Lychee Desktop"
RequestExecutionLevel admin
ShowInstDetails show
ShowUninstDetails show
BrandingText "${PRODUCT_PUBLISHER}"
SetCompressor /SOLID lzma
SetCompressorDictSize 64

; ── Version Info ──────────────────────────────────────────────────────
VIProductVersion "${PRODUCT_VERSION_FULL}"
VIFileVersion    "${PRODUCT_VERSION_FULL}"
VIAddVersionKey "ProductName"     "${PRODUCT_NAME}"
VIAddVersionKey "CompanyName"     "${PRODUCT_PUBLISHER}"
VIAddVersionKey "LegalCopyright"  "${PRODUCT_COPYRIGHT}"
VIAddVersionKey "FileDescription" "${PRODUCT_DESCRIPTION}"
VIAddVersionKey "FileVersion"     "${PRODUCT_VERSION}"
VIAddVersionKey "ProductVersion"  "${PRODUCT_VERSION}"

; ── Modern UI 2 Configuration ─────────────────────────────────────────
!define MUI_ICON   "${ICON_PATH}"
!define MUI_UNICON "${ICON_PATH}"

!define MUI_WELCOMEPAGE_TITLE        "Welcome to Lychee Desktop Setup"
!define MUI_WELCOMEPAGE_TEXT         "This wizard will install ${PRODUCT_NAME} ${PRODUCT_VERSION} on your computer.$\r$\n$\r$\nLychee Desktop is a native desktop app for Lychee — the universal LLM runtime. Manage models, build pipelines, and chat, all from your desktop.$\r$\n$\r$\nClick Next to continue."
!define MUI_FINISHPAGE_TITLE         "Installation Complete"
!define MUI_FINISHPAGE_TEXT          "${PRODUCT_NAME} ${PRODUCT_VERSION} has been installed successfully."
!define MUI_FINISHPAGE_RUN           "$INSTDIR\${PRODUCT_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT      "Launch ${PRODUCT_NAME}"
!define MUI_FINISHPAGE_SHOWREADME    "${PRODUCT_WEBSITE}"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Visit Lychee Website"
!define MUI_FINISHPAGE_LINK          "lychee.dev"
!define MUI_FINISHPAGE_LINK_COLOR    "4A90D9"

!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING

; ── Pages ─────────────────────────────────────────────────────────────
; Installer pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE     "..\LICENSE"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Language
!insertmacro MUI_LANGUAGE "English"

; ── Installer Section ─────────────────────────────────────────────────
Section "Lychee Desktop" SecMain
    SetShellVarContext all
    SetOutPath "$INSTDIR"

    ; ── Check for running instance ────────────────────────────────────
    FindWindow $0 "" "Lychee Desktop"
    ${If} $0 <> 0
        MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
            "${PRODUCT_NAME} appears to be running.$\r$\n$\r$\nPlease close it before continuing." \
            IDCANCEL abort_install
        ; User chose OK — try again
        FindWindow $0 "" "Lychee Desktop"
        ${If} $0 <> 0
            MessageBox MB_OK|MB_ICONSTOP \
                "${PRODUCT_NAME} is still running. Setup cannot continue."
            abort_install:
            Abort
        ${EndIf}
    ${EndIf}

    ; ── Check Windows version ─────────────────────────────────────────
    ${IfNot} ${AtLeastWin10}
        MessageBox MB_OK|MB_ICONSTOP \
            "${PRODUCT_NAME} requires Windows 10 or later."
        Abort
    ${EndIf}

    ; ── Install WebView2 Runtime (required by Wails apps) ─────────────
    DetailPrint "Checking WebView2 Runtime..."
    SetRegView 64
    ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${If} $0 == ""
        ReadRegStr $0 HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    ${EndIf}
    ${If} $0 == ""
        MessageBox MB_YESNO|MB_ICONINFORMATION \
            "${PRODUCT_NAME} requires the WebView2 Runtime.$\r$\n$\r$\nInstall it now?" \
            IDNO skip_webview2
        DetailPrint "Downloading WebView2 Runtime..."
        InitPluginsDir
        NSISdl::download "https://go.microsoft.com/fwlink/p/?LinkId=2124703" \
            "$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe"
        Pop $0
        ${If} $0 == "success"
            DetailPrint "Installing WebView2 Runtime (this may take a moment)..."
            ExecWait '"$PLUGINSDIR\MicrosoftEdgeWebview2Setup.exe" /silent /install' $0
            ${If} $0 != 0
                MessageBox MB_OK|MB_ICONEXCLAMATION \
                    "WebView2 installation may not have completed successfully (exit code $0).$\r$\nYou can install it later from https://go.microsoft.com/fwlink/p/?LinkId=2124703"
            ${EndIf}
        ${Else}
            MessageBox MB_OK|MB_ICONEXCLAMATION \
                "Could not download WebView2 Runtime.$\r$\nPlease install it manually from https://go.microsoft.com/fwlink/p/?LinkId=2124703"
        ${EndIf}
        skip_webview2:
    ${EndIf}

    ; ── Copy application files ────────────────────────────────────────
    DetailPrint "Installing ${PRODUCT_NAME}..."
    File /r "${EXE_PATH}"

    ; ── Write uninstaller ─────────────────────────────────────────────
    WriteUninstaller "$INSTDIR\uninstall.exe"

    ; ── Start Menu Shortcuts ──────────────────────────────────────────
    CreateDirectory "$SMPROGRAMS\${PRODUCT_STARTMENU}"
    CreateShortCut "$SMPROGRAMS\${PRODUCT_STARTMENU}\${PRODUCT_NAME}.lnk" \
        "$INSTDIR\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\${PRODUCT_EXECUTABLE}" 0
    CreateShortCut "$SMPROGRAMS\${PRODUCT_STARTMENU}\Uninstall ${PRODUCT_NAME}.lnk" \
        "$INSTDIR\uninstall.exe" "" "$INSTDIR\uninstall.exe" 0

    ; ── Desktop Shortcut ──────────────────────────────────────────────
    CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" \
        "$INSTDIR\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\${PRODUCT_EXECUTABLE}" 0 \
        SW_SHOWNORMAL "" "${PRODUCT_DESCRIPTION}"

    ; ── Quick Launch Shortcut ─────────────────────────────────────────
    CreateShortCut "$QUICKLAUNCH\${PRODUCT_NAME}.lnk" \
        "$INSTDIR\${PRODUCT_EXECUTABLE}" "" "$INSTDIR\${PRODUCT_EXECUTABLE}" 0

    ; ── Register with Add/Remove Programs ────────────────────────────
    SetRegView 64
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "DisplayName"           "${PRODUCT_NAME}"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "DisplayVersion"        "${PRODUCT_VERSION}"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "Publisher"             "${PRODUCT_PUBLISHER}"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "DisplayIcon"           "$INSTDIR\${PRODUCT_EXECUTABLE},0"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "UninstallString"       "$\"$INSTDIR\uninstall.exe$\""
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "QuietUninstallString"  "$\"$INSTDIR\uninstall.exe$\" /S"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "InstallLocation"       "$INSTDIR"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "URLInfoAbout"          "${PRODUCT_WEBSITE}"
    WriteRegStr   HKLM "${PRODUCT_UNINST_KEY}" "HelpLink"              "${PRODUCT_WEBSITE}"
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoModify"              1
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "NoRepair"              1

    ; Estimated size
    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM "${PRODUCT_UNINST_KEY}" "EstimatedSize" "$0"

    ; ── Application registration ──────────────────────────────────────
    WriteRegStr HKLM "${PRODUCT_REG_KEY}" ""              "${PRODUCT_VERSION}"
    WriteRegStr HKLM "${PRODUCT_REG_KEY}" "InstallDir"    "$INSTDIR"
    WriteRegStr HKLM "${PRODUCT_REG_KEY}" "Version"       "${PRODUCT_VERSION}"

    ; ── Register .lychee and .lychee-pipeline file associations ──────
    ; .lychee → Lychee config files
    WriteRegStr HKLM "Software\Classes\.lychee"            ""                         "Lychee.Config"
    WriteRegStr HKLM "Software\Classes\.lychee"            "Content Type"             "application/x-lychee-config"
    WriteRegStr HKLM "Software\Classes\Lychee.Config"      ""                         "Lychee Configuration File"
    WriteRegStr HKLM "Software\Classes\Lychee.Config\DefaultIcon" ""                  "$INSTDIR\${PRODUCT_EXECUTABLE},0"
    WriteRegStr HKLM "Software\Classes\Lychee.Config\shell\open\command" ""            "$\"$INSTDIR\${PRODUCT_EXECUTABLE}$\" $\"%1$\""

    ; .lychee-pipeline → Lychee pipeline files
    WriteRegStr HKLM "Software\Classes\.lychee-pipeline"   ""                         "Lychee.Pipeline"
    WriteRegStr HKLM "Software\Classes\.lychee-pipeline"   "Content Type"             "application/x-lychee-pipeline"
    WriteRegStr HKLM "Software\Classes\Lychee.Pipeline"    ""                         "Lychee Pipeline File"
    WriteRegStr HKLM "Software\Classes\Lychee.Pipeline\DefaultIcon" ""                "$INSTDIR\${PRODUCT_EXECUTABLE},0"
    WriteRegStr HKLM "Software\Classes\Lychee.Pipeline\shell\open\command" ""          "$\"$INSTDIR\${PRODUCT_EXECUTABLE}$\" $\"%1$\""

    ; ── Register custom protocol: lychee:// ───────────────────────────
    WriteRegStr HKLM "Software\Classes\lychee"               ""                      "URL:Lychee Protocol"
    WriteRegStr HKLM "Software\Classes\lychee"               "URL Protocol"          ""
    WriteRegStr HKLM "Software\Classes\lychee\DefaultIcon"   ""                      "$INSTDIR\${PRODUCT_EXECUTABLE},0"
    WriteRegStr HKLM "Software\Classes\lychee\shell\open\command" ""                 "$\"$INSTDIR\${PRODUCT_EXECUTABLE}$\" $\"%1$\""

    ; ── Notify system of file association changes ────────────────────
    System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'

SectionEnd

; ── Uninstaller Section ───────────────────────────────────────────────
Section "Uninstall"

    SetShellVarContext all

    ; ── Check for running instance ────────────────────────────────────
    FindWindow $0 "" "Lychee Desktop"
    ${If} $0 <> 0
        MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
            "${PRODUCT_NAME} appears to be running.$\r$\n$\r$\nPlease close it before uninstalling." \
            IDCANCEL abort_uninstall
        FindWindow $0 "" "Lychee Desktop"
        ${If} $0 <> 0
            MessageBox MB_OK|MB_ICONSTOP \
                "${PRODUCT_NAME} is still running. Uninstall cannot continue."
            abort_uninstall:
            Abort
        ${EndIf}
    ${EndIf}

    ; ── Remove Start Menu items ───────────────────────────────────────
    Delete "$SMPROGRAMS\${PRODUCT_STARTMENU}\${PRODUCT_NAME}.lnk"
    Delete "$SMPROGRAMS\${PRODUCT_STARTMENU}\Uninstall ${PRODUCT_NAME}.lnk"
    RMDir  "$SMPROGRAMS\${PRODUCT_STARTMENU}"

    ; ── Remove Desktop shortcut ───────────────────────────────────────
    Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

    ; ── Remove Quick Launch shortcut ──────────────────────────────────
    Delete "$QUICKLAUNCH\${PRODUCT_NAME}.lnk"

    ; ── Remove file associations ──────────────────────────────────────
    DeleteRegKey HKLM "Software\Classes\.lychee"
    DeleteRegKey HKLM "Software\Classes\Lychee.Config"
    DeleteRegKey HKLM "Software\Classes\.lychee-pipeline"
    DeleteRegKey HKLM "Software\Classes\Lychee.Pipeline"

    ; ── Remove custom protocol ────────────────────────────────────────
    DeleteRegKey HKLM "Software\Classes\lychee"

    ; ── Remove Add/Remove Programs entry ──────────────────────────────
    SetRegView 64
    DeleteRegKey HKLM "${PRODUCT_UNINST_KEY}"

    ; ── Remove application registry ───────────────────────────────────
    DeleteRegKey HKLM "${PRODUCT_REG_KEY}"

    ; ── Remove application directory ──────────────────────────────────
    ; Remove WebView2 data dir from AppData (if exists)
    RMDir /r "$LOCALAPPDATA\Lychee Desktop"

    ; Remove install directory
    RMDir /r "$INSTDIR"

    ; ── Notify system ─────────────────────────────────────────────────
    System::Call 'Shell32::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'

SectionEnd

; ── Installer Callbacks ────────────────────────────────────────────────

Function .onInit
    ; Check for /S (silent) flag
    ${GetParameters} $R0
    ${GetOptions} $R0 "/S" $R1
    IfErrors +2 0
        SetSilent silent

    ; Verify admin rights
    UserInfo::GetAccountType
    Pop $0
    ${If} $0 != "admin"
        MessageBox MB_OK|MB_ICONSTOP \
            "Administrator privileges required.$\r$\n$\r$\nPlease run this installer as Administrator."
        Abort
    ${EndIf}

    ; Check 64-bit
    ${IfNot} ${RunningX64}
        MessageBox MB_OK|MB_ICONSTOP \
            "${PRODUCT_NAME} requires a 64-bit version of Windows."
        Abort
    ${EndIf}
FunctionEnd

Function .onInstSuccess
    ; Optionally launch after silent install
    ${GetParameters} $R0
    ${GetOptions} $R0 "/R" $R1
    IfErrors done
        Exec '"$INSTDIR\${PRODUCT_EXECUTABLE}"'
    done:
FunctionEnd

; ── Uninstaller Callbacks ─────────────────────────────────────────────

Function un.onInit
    ${GetParameters} $R0
    ${GetOptions} $R0 "/S" $R1
    IfErrors +2 0
        SetSilent silent

    ; Verify admin rights
    UserInfo::GetAccountType
    Pop $0
    ${If} $0 != "admin"
        MessageBox MB_OK|MB_ICONSTOP \
            "Administrator privileges required.$\r$\n$\r$\nPlease run the uninstaller as Administrator."
        Abort
    ${EndIf}
FunctionEnd
