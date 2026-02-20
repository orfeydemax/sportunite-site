param(
    [string]$Url
)
# Open URL robustly using default browser or Chrome directly
# This avoids keyboard layout issues with SendKeys for non-Latin characters
Start-Process "chrome" $Url
