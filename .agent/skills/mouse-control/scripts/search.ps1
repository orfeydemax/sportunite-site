param(
    [string]$Query
)

# Load SendKeys
Add-Type -AssemblyName System.Windows.Forms

# Ensure Chrome is focused/started
Start-Process "chrome"
Start-Sleep -Milliseconds 500

# New Tab (Ctrl+T)
# Only works if focused.
[System.Windows.Forms.SendKeys]::SendWait("^t")
Start-Sleep -Milliseconds 300

# Type Query into Address Bar (It's focused by default in new tab)
[System.Windows.Forms.SendKeys]::SendWait($Query)
Start-Sleep -Milliseconds 100

# Enter
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
