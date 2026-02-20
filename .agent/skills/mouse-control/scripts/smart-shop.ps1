param(
    [string]$Url = "https://soab.pro",
    [string]$ProfileName = "Максим Востриков",
    [string[]]$Keywords = @("Футболка", "T-shirt", "Tee"),
    [string[]]$CategoryKeywords = @("Каталог", "Магазин", "Shop", "Одежда", "Меню")
)

# Handle Encoding for Default Profile Name
if ($ProfileName -eq "Максим Востриков") {
    $bytes = @(0x1c, 0x04, 0x30, 0x04, 0x3a, 0x04, 0x41, 0x04, 0x38, 0x04, 0x3c, 0x04, 0x20, 0x00, 0x12, 0x04, 0x3e, 0x04, 0x41, 0x04, 0x42, 0x04, 0x40, 0x04, 0x38, 0x04, 0x3a, 0x04, 0x3e, 0x04, 0x32, 0x04)
    $ProfileName = [System.Text.Encoding]::Unicode.GetString($bytes)
}

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Win32 Mouse
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
    $Steps = 10
    for ($i = 0; $i -le $Steps; $i++) {
        $t = $i / $Steps
        $X = $Current.X + ($TX - $Current.X) * $t
        $Y = $Current.Y + ($TY - $Current.Y) * $t
        [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]$X, [int]$Y)
        Start-Sleep -Milliseconds 5
    }
}

function Find-Profile-And-Click($NameFragment) {
    $Root = [System.Windows.Automation.AutomationElement]::RootElement
    $ConditionTrue = [System.Windows.Automation.Condition]::TrueCondition
    $Windows = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $ConditionTrue)
    foreach ($Win in $Windows) {
        try {
            $Elements = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $ConditionTrue)
            foreach ($El in $Elements) {
                if ($El.Current.Name -match $NameFragment) {
                    $Rect = $El.Current.BoundingRectangle
                    if ($Rect.Width -gt 0 -and $Rect.Width -lt 5000) {
                        $CX = $Rect.X + ($Rect.Width / 2); $CY = $Rect.Y + ($Rect.Height / 2)
                        Write-Host "Found Profile at $CX, $CY."
                        Click-At $CX $CY
                        return $true
                    }
                }
            }
        }
        catch {}
    }
    return $false
}

function Scan-And-Click($Targets) {
    Write-Host "Scanning for: $($Targets -join ', ')..."
    $Root = [System.Windows.Automation.AutomationElement]::RootElement
    $ConditionTrue = [System.Windows.Automation.Condition]::TrueCondition
    
    $Windows = $Root.FindAll([System.Windows.Automation.TreeScope]::Children, $ConditionTrue)
    
    foreach ($Win in $Windows) {
        if ($Win.Current.Name -match "Chrome") {
            try {
                $Elements = $Win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $ConditionTrue)
                foreach ($El in $Elements) {
                    $Name = $El.Current.Name
                    if (-not [string]::IsNullOrWhiteSpace($Name) -and $Name.Length -gt 2) {
                        # LOGGING FOUND ITEMS (DEBUG)
                        # Write-Host "Seen: $Name" 

                        foreach ($T in $Targets) {
                            if ($Name -match $T) {
                                $Rect = $El.Current.BoundingRectangle
                                if ($Rect.Width -gt 0 -and $Rect.Width -lt 3000 -and $Rect.Height -gt 0) {
                                    $CX = $Rect.X + ($Rect.Width / 2)
                                    $CY = $Rect.Y + ($Rect.Height / 2)
                                    Write-Host "HIT: '$Name' matches '$T' at $CX, $CY"
                                    Move-MouseSmoothed $CX $CY
                                    Click-At $CX $CY
                                    return $true
                                }
                            }
                        }
                    }
                }
            }
            catch {}
        }
    }
    return $false
}

$Screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds

# WORKFLOW

# 1. Minimize (Skip if already minimized, hard to know, but click corner anyway)
Move-MouseSmoothed ($Screen.Width - 110) 15
Click-At ($Screen.Width - 110) 15
Start-Sleep -Seconds 1

# 2. Chrome
Start-Process "chrome"
Start-Sleep -Seconds 2

# 3. Profile
if ($ProfileName) {
    Find-Profile-And-Click $ProfileName
    Start-Sleep -Seconds 2
}

# 4. URL
Move-MouseSmoothed ($Screen.Width / 2) 70  
Click-At ($Screen.Width / 2) 65
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait("^a") 
Start-Sleep -Milliseconds 50
[System.Windows.Forms.SendKeys]::SendWait("{DEL}") 
Start-Sleep -Milliseconds 50
[System.Windows.Forms.SendKeys]::SendWait($Url)
Start-Sleep -Milliseconds 100
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

Write-Host "Waiting for page load (8s)..."
Start-Sleep -Seconds 8

# 5. Search Loop
$MaxScrolls = 8
for ($i = 0; $i -le $MaxScrolls; $i++) {
    Write-Host "--- Scan #$($i+1) ---"
    
    # Try Product Keywords First
    if (Scan-And-Click $Keywords) {
        Write-Host "Product Found!"
        exit
    }
    
    # Try Category/Menu if product not found (only on first few passes)
    if ($i -lt 2) {
        if (Scan-And-Click $CategoryKeywords) {
            Write-Host "Category Found! Clicking and waiting..."
            Start-Sleep -Seconds 5 # Wait for menu open/load
            # Then scan for product again immediately
            if (Scan-And-Click $Keywords) {
                Write-Host "Product Found inside Category!"
                exit
            }
        }
    }
    
    # Scroll
    Write-Host "Scrolling..."
    Move-MouseSmoothed ($Screen.Width / 2) ($Screen.Height / 2)
    Click-At ($Screen.Width / 2) ($Screen.Height / 2)
    [System.Windows.Forms.SendKeys]::SendWait("{PGDN}")
    Start-Sleep -Seconds 2
}

Write-Host "Not found."
