param(
    [string]$Url = "https://farfetch.com", 
    [string]$ProfileName,
    [string]$ClickTarget
)

# Handle Encoding for Default Profile Name "Максим Востриков"
if (-not $ProfileName) {
    # UTF-16LE bytes
    $bytes = @(0x1c, 0x04, 0x30, 0x04, 0x3a, 0x04, 0x41, 0x04, 0x38, 0x04, 0x3c, 0x04, 0x20, 0x00, 0x12, 0x04, 0x3e, 0x04, 0x41, 0x04, 0x42, 0x04, 0x40, 0x04, 0x38, 0x04, 0x3a, 0x04, 0x3e, 0x04, 0x32, 0x04)
    $ProfileName = [System.Text.Encoding]::Unicode.GetString($bytes)
}

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Mouse Helper using P/Invoke
$signature = @"
[DllImport("user32.dll",CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)]
public static extern void mouse_event(long dwFlags, long dx, long dy, long cButtons, long dwExtraInfo);
"@
if (-not ([System.Management.Automation.PSTypeName]'Win32Functions').Type) {
    Add-Type -MemberDefinition $signature -Name "Win32MouseEvent" -Namespace Win32Functions
}
$MOUSEEVENTF_LEFTDOWN = 0x00000002
$MOUSEEVENTF_LEFTUP = 0x00000004

function Click-At($X, $Y) {
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$X, [int]$Y)
    Start-Sleep -Milliseconds 100
    [Win32Functions.Win32MouseEvent]::mouse_event($MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0)
    Start-Sleep -Milliseconds 50
    [Win32Functions.Win32MouseEvent]::mouse_event($MOUSEEVENTF_LEFTUP, 0, 0, 0, 0)
}

function Move-MouseSmoothed($TX, $TY) {
    $Current = [System.Windows.Forms.Cursor]::Position
    $Steps = 20
    for ($i = 0; $i -le $Steps; $i++) {
        $t = $i / $Steps
        $X = $Current.X + ($TX - $Current.X) * $t
        $Y = $Current.Y + ($TY - $Current.Y) * $t
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$X, [int]$Y)
        Start-Sleep -Milliseconds 5
    }
}

function Find-And-Click($NameFragment, $TimeoutSeconds = 5) {
    Write-Host "Looking for UI Element containing '$NameFragment' (Timeout: ${TimeoutSeconds}s)..."
    $EndTime = (Get-Date).AddSeconds($TimeoutSeconds)
    
    $Root = [System.Windows.Automation.AutomationElement]::RootElement
    $ConditionTrue = [System.Windows.Automation.Condition]::TrueCondition

    do {
        # Search Top Level Windows first
        $Windows = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $ConditionTrue)
        
        foreach ($Win in $Windows) {
            try {
                $Elements = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $ConditionTrue)
                foreach ($El in $Elements) {
                    if ($El.Current.Name -match $NameFragment) {
                        $Rect = $El.Current.BoundingRectangle
                        if ($Rect.Width -gt 0 -and $Rect.Width -lt 5000 -and $Rect.Height -gt 0) {
                            $CX = $Rect.X + ($Rect.Width / 2)
                            $CY = $Rect.Y + ($Rect.Height / 2)
                            Write-Host "Found '$($El.Current.Name)' at $CX, $CY. Clicking..."
                            Move-MouseSmoothed $CX $CY
                            Click-At $CX $CY
                            return $true
                        }
                    }
                }
            }
            catch {}
        }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $EndTime)
    
    Write-Warning "Element '$NameFragment' not found within timeout."
    return $false
}

$Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

# 1. Minimize Current Window
Write-Host "Minimizing current window..."
Move-MouseSmoothed ($Screen.Width - 110) 15
Click-At ($Screen.Width - 110) 15
Start-Sleep -Seconds 1

# 2. Open Chrome
Write-Host "Launching Chrome..."
Start-Process "chrome"
Start-Sleep -Seconds 2

# 3. Select Profile (if needed)
if ($ProfileName) {
    $Clicked = Find-And-Click $ProfileName 3 
    if ($Clicked) {
        Write-Host "Profile selected. Waiting for browser..."
        Start-Sleep -Seconds 3
    }
}

# 4. Focus Address Bar
Write-Host "Focusing Address Bar..."
Move-MouseSmoothed ($Screen.Width / 2) 70  
Click-At ($Screen.Width / 2) 65
Start-Sleep -Milliseconds 500

# 5. Type URL using SendKeys
[System.Windows.Forms.SendKeys]::SendWait("^a") 
Start-Sleep -Milliseconds 100
[System.Windows.Forms.SendKeys]::SendWait("{DEL}")
Start-Sleep -Milliseconds 100
[System.Windows.Forms.SendKeys]::SendWait($Url)
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

# 6. Click Target Content
if ($ClickTarget) {
    Write-Host "Waiting for page load (10s)..."
    Start-Sleep -Seconds 10
    Find-And-Click $ClickTarget 10
}

Write-Host "Done."
